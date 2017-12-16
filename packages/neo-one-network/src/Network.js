/* @flow */
import { type Duplex } from 'stream';
import {
  type Endpoint,
  createEndpoint,
  getEndpointConfig,
} from '@neo-one/node-core';
import type { Observable } from 'rxjs/Observable';

import net from 'net';
import { take } from 'rxjs/operators';
import { utils } from '@neo-one/utils';

import ConnectedPeer from './ConnectedPeer';
import { type OnEvent } from './event';
import type Peer from './Peer';
import TCPPeer from './TCPPeer';
import { UnsupportedEndpointType } from './errors';

export type ListenTCP = {|
  port: number,
  host?: string,
|};

export type NegotiateResult<PeerData> = {|
  data: PeerData,
  relay: boolean,
|};

export type Environment = {|
  listenTCP?: ListenTCP,
  externalEndpoints?: Array<Endpoint>,
  connectPeersDelayMS?: number,
  socketTimeoutMS?: number,
|};

export type Options = {|
  seeds: Array<Endpoint>,
  maxConnectedPeers?: number,
|};

type NetworkOptions<Message, PeerData> = {|
  environment: Environment,
  options$: Observable<Options>,
  negotiate: (peer: Peer<Message>) => Promise<NegotiateResult<PeerData>>,
  createMessageTransform: () => Duplex,
  onMessageReceived: (
    peer: ConnectedPeer<Message, PeerData>,
    message: Message,
  ) => void,
  onRequestEndpoints: () => void,
  onEvent?: OnEvent<Message, PeerData>,
|};

const emptyFunction = () => {};

const normalizeEndpoint = (endpoint: Endpoint) => {
  const { type, host, port } = getEndpointConfig(endpoint);
  return createEndpoint({
    type,
    host: host === 'localhost' ? '127.0.0.1' : host,
    port,
  });
};

export default class Network<Message, PeerData> {
  _started: boolean;
  _stopped: boolean;

  _externalEndpoints: Set<Endpoint>;
  _connectPeersDelayMS: number;
  _maxConnectedPeers: number;
  _options$: Observable<Options>;
  _socketTimeoutMS: number;

  _connectedPeers: { [endpoint: Endpoint]: ConnectedPeer<Message, PeerData> };
  _connectingPeers: { [endpoint: Endpoint]: boolean };
  _unconnectedPeers: Set<Endpoint>;
  _endpointBlacklist: Set<Endpoint>;
  _reverseBlacklist: { [endpoint: Endpoint]: Endpoint };

  _listenTCP: ?ListenTCP;
  _tcpServer: ?net.Server;

  _connectPeersTimeout: ?number;

  __negotiate: (peer: Peer<Message>) => Promise<NegotiateResult<PeerData>>;
  __createMessageTransform: () => Duplex;
  __onMessageReceived: (
    peer: ConnectedPeer<Message, PeerData>,
    message: Message,
  ) => void;
  __onRequestEndpoints: () => void;
  __onEvent: OnEvent<Message, PeerData>;

  constructor(options: NetworkOptions<Message, PeerData>) {
    const { environment, options$ } = options;
    this._started = false;
    this._stopped = false;

    this._externalEndpoints = new Set(environment.externalEndpoints || []);
    this._connectPeersDelayMS =
      environment.connectPeersDelayMS == null
        ? 1000
        : environment.connectPeersDelayMS;
    this._maxConnectedPeers =
      environment.maxConnectedPeers == null
        ? 10
        : environment.maxConnectedPeers;
    this._options$ = options$;
    this._socketTimeoutMS =
      environment.socketTimeoutMS == null
        ? 1000 * 60
        : environment.socketTimeoutMS;

    this._connectedPeers = {};
    this._connectingPeers = {};
    this._unconnectedPeers = new Set();
    this._endpointBlacklist = new Set();
    this._reverseBlacklist = {};

    this._listenTCP = environment.listenTCP;
    this._tcpServer = null;

    this._connectPeersTimeout = null;

    this.__negotiate = options.negotiate;
    this.__createMessageTransform = options.createMessageTransform;
    this.__onMessageReceived = options.onMessageReceived;
    this.__onRequestEndpoints = options.onRequestEndpoints;
    this.__onEvent = options.onEvent || emptyFunction;

    // $FlowFixMe
    this._onError = this._onError.bind(this);
    // $FlowFixMe
    this._onClose = this._onClose.bind(this);
  }

  start(): void {
    if (this._started) {
      return;
    }
    this._started = true;
    this._stopped = false;

    this.__onEvent({
      event: 'NETWORK_START',
      message: 'Network starting...',
    });

    try {
      this._startServer();
    } catch (error) {
      this._started = false;
      throw error;
    }

    try {
      this._run();
    } catch (error) {
      this._started = false;
      throw error;
    }
  }

  stop(): void {
    if (this._stopped || !this._started) {
      return;
    }
    this._stopped = true;

    this.__onEvent({
      event: 'NETWORK_STOP',
      message: 'Network stopping...',
    });

    try {
      if (this._connectPeersTimeout != null) {
        clearTimeout(this._connectPeersTimeout);
        this._connectPeersTimeout = null;
      }

      utils.keys(this._connectedPeers).forEach(endpoint => {
        this._connectedPeers[endpoint].close();
        delete this._connectedPeers[endpoint];
      });

      if (this._tcpServer != null) {
        this._tcpServer.close();
      }

      this._started = false;
    } catch (error) {
      this._stopped = false;
      throw error;
    }
  }

  addEndpoint(endpoint: Endpoint): void {
    if (!this._externalEndpoints.has(endpoint)) {
      this._unconnectedPeers.add(endpoint);
    }
  }

  relay(buffer: Buffer): void {
    for (const peer of utils.values(this._connectedPeers)) {
      if (peer.relay) {
        peer.write(buffer);
      }
    }
  }

  get connectedPeers(): Array<ConnectedPeer<Message, PeerData>> {
    return utils.values(this._connectedPeers);
  }

  _startServer(): void {
    const listenTCP = this._listenTCP;
    if (listenTCP == null) {
      return;
    }

    const tcpServer = net.createServer({ pauseOnConnect: true }, socket => {
      const host = socket.remoteAddress;
      if (host == null) {
        socket.end();
        return;
      }
      const endpoint = createEndpoint({
        type: 'tcp',
        host,
        port: socket.remotePort,
      });
      this._connectToPeer({ endpoint, socket });
    });
    this._tcpServer = tcpServer;
    tcpServer.on('error', error => {
      this.__onEvent({
        event: 'TCP_SERVER_ERROR',
        message: `TCP peer server encountered an error: $${error.message}`,
        data: { error },
      });
    });
    const host = listenTCP.host == null ? '0.0.0.0' : listenTCP.host;
    tcpServer.listen(listenTCP.port, host);

    this.__onEvent({
      event: 'TCP_SERVER_LISTEN',
      message: `Listening on ${host}:${listenTCP.port}.`,
      data: { host, port: listenTCP.port },
    });
  }

  async _run(): Promise<void> {
    this.__onEvent({
      event: 'CONNECT_LOOP_START',
      message: 'Starting connect loop...',
    });
    while (!this._stopped) {
      try {
        // eslint-disable-next-line
        await this._connectToPeers();
        // eslint-disable-next-line
        await new Promise(resolve => {
          this._connectPeersTimeout = setTimeout(() => {
            this._connectPeersTimeout = null;
            resolve();
          }, this._connectPeersDelayMS);
        });
      } catch (error) {
        this.__onEvent({
          event: 'CONNECT_LOOP_ERROR',
          message: `Encountered error in connect loop: ${error.message}`,
          data: { error },
        });
      }
    }
  }

  async _connectToPeers(): Promise<void> {
    const connectedPeersCount = Object.keys(this._connectedPeers).length;
    let endpoints = [];
    const {
      seeds,
      maxConnectedPeers: maxConnectedPeersIn,
    } = await this._options$.pipe(take(1)).toPromise();
    const maxConnectedPeers =
      maxConnectedPeersIn == null ? 10 : maxConnectedPeersIn;
    if (connectedPeersCount < maxConnectedPeers) {
      const count = maxConnectedPeers - connectedPeersCount;
      endpoints.push(
        ...[...this._unconnectedPeers]
          .filter(peer => !this._endpointBlacklist.has(peer))
          .slice(0, count),
      );
    }

    if (endpoints.length + connectedPeersCount < maxConnectedPeers) {
      this.__onRequestEndpoints();
    }

    endpoints.push(...seeds);
    endpoints = endpoints.filter(
      endpoint => !this._endpointBlacklist.has(endpoint),
    );

    endpoints.forEach(endpoint => this._connectToPeer({ endpoint }));
  }

  async _connectToPeer({
    endpoint: endpointIn,
    socket,
  }: {|
    endpoint: Endpoint,
    socket?: net.Socket,
  |}): Promise<void> {
    const endpoint = normalizeEndpoint(endpointIn);
    if (
      this._endpointBlacklist.has(endpoint) ||
      this._connectingPeers[endpoint] ||
      this._connectedPeers[endpoint] != null
    ) {
      return;
    }
    this._connectingPeers[endpoint] = true;

    this.__onEvent({
      event: 'PEER_CONNECT_START',
      message: `Connecting to peer at ${endpoint}`,
      data: { peer: endpoint },
    });
    try {
      const endpointConfig = getEndpointConfig(endpoint);
      if (endpointConfig.type === 'tcp') {
        await this._startPeerConnection(
          this._createTCPPeer(endpoint, socket),
          true,
        );
      } else {
        throw new UnsupportedEndpointType(endpoint);
      }
    } catch (error) {
      this.__onEvent({
        event: 'PEER_CONNECT_ERROR',
        message: `Failed to connect to peer at ${endpoint}: ${error.message}`,
        data: { error, peer: endpoint },
      });
    } finally {
      delete this._connectingPeers[endpoint];
    }
  }

  async _startPeerConnection(
    peer: Peer<Message>,
    blacklist?: boolean,
  ): Promise<void> {
    try {
      await peer.connect();
    } catch (error) {
      peer.close();
      this._unconnectedPeers.delete(peer.endpoint);
      throw error;
    }

    let data;
    let relay;
    try {
      const result = await this.__negotiate(peer);
      // eslint-disable-next-line
      data = result.data;
      // eslint-disable-next-line
      relay = result.relay;
    } catch (error) {
      if (
        typeof error.code === 'string' &&
        error.code === 'ALREADY_CONNECTED' &&
        blacklist
      ) {
        this._endpointBlacklist.add(peer.endpoint);
        this._reverseBlacklist[error.endpoint] = peer.endpoint;
      }
      peer.close();
      throw error;
    }

    if (peer.connected) {
      const connectedPeer = new ConnectedPeer({ peer, data, relay });
      this._connectedPeers[peer.endpoint] = connectedPeer;
      connectedPeer.peer.streamData(message =>
        this.__onMessageReceived(connectedPeer, message),
      );

      this.__onEvent({
        event: 'PEER_CONNECT_SUCCESS',
        message: `Connected to peer at ${peer.endpoint}`,
        data: { peer: peer.endpoint },
        extra: { connectedPeer },
      });
    }
  }

  _createTCPPeer(endpoint: Endpoint, socket?: net.Socket): TCPPeer<Message> {
    return new TCPPeer({
      endpoint,
      socket,
      transform: this.__createMessageTransform(),
      timeoutMS: this._socketTimeoutMS,
      onError: this._onError,
      onClose: this._onClose,
    });
  }

  _onError(peer: Peer<Message>, error: Error): void {
    peer.close();
    this.__onEvent({
      event: 'PEER_ERROR',
      message: `Encountered error with peer at ${peer.endpoint}: ${
        error.message
      }`,
      data: { error, peer: peer.endpoint },
    });
  }

  _onClose(peer: Peer<Message>): void {
    const connectedPeer = this._connectedPeers[peer.endpoint];
    if (connectedPeer != null) {
      delete this._connectedPeers[peer.endpoint];
    }
    const endpoint = this._reverseBlacklist[peer.endpoint];
    if (endpoint != null) {
      delete this._reverseBlacklist[peer.endpoint];
      this._endpointBlacklist.delete((endpoint: $FlowFixMe));
    }
    this.__onEvent({
      event: 'PEER_CLOSED',
      message: `Peer at ${peer.endpoint} closed.`,
      data: { peer: peer.endpoint },
      extra: { peer: connectedPeer || peer },
    });
  }
}
