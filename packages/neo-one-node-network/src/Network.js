/* @flow */
import { type Duplex } from 'stream';
import {
  type Endpoint,
  createEndpoint,
  getEndpointConfig,
} from '@neo-one/node-core';
import type { Gauge, Monitor } from '@neo-one/monitor';
import type { Observable } from 'rxjs/Observable';
import type { Subscription } from 'rxjs/Subscription';

import _ from 'lodash';
import net from 'net';
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
|};

export type Options = {|
  seeds: Array<Endpoint>,
  peerSeeds?: Array<Endpoint>,
  maxConnectedPeers?: number,
  externalEndpoints?: Array<Endpoint>,
  connectPeersDelayMS?: number,
  socketTimeoutMS?: number,
  connectErrorCodes?: Array<string>,
|};

export type PeerHealthBase = {
  healthy: boolean,
};

type NetworkOptions<Message, PeerData, PeerHealth: PeerHealthBase> = {|
  monitor: Monitor,
  environment: Environment,
  options$: Observable<Options>,
  negotiate: (peer: Peer<Message>) => Promise<NegotiateResult<PeerData>>,
  checkPeerHealth: (
    connectedPeer: ConnectedPeer<Message, PeerData>,
    previousHealth?: PeerHealth,
  ) => PeerHealth,
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
    host: host === 'localhost' ? '::' : host,
    port,
  });
};

const EXTERNAL_ENDPOINTS = new Set();
const MAX_CONNECTED_PEERS = 10;
const CONNECT_PEERS_DELAY_MS = 5000;
const SOCKET_TIMEOUT_MS = 1000 * 60;
const CONNECT_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ERR_INVALID_IP_ADDRESS',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'SOCKET_TIMEOUT',
  'RECEIVE_MESSAGE_TIMEOUT',
  'EADDRNOTAVAIL',
  'ETIMEDOUT',
]);

export default class Network<Message, PeerData, PeerHealth: PeerHealthBase> {
  _monitor: Monitor;
  _started: boolean;
  _stopped: boolean;

  _externalEndpoints: Set<Endpoint>;
  _maxConnectedPeers: number;
  _connectPeersDelayMS: number;
  _options$: Observable<Options>;
  _socketTimeoutMS: number;
  _connectErrorCodes: Set<string>;

  _connectedPeers: { [endpoint: Endpoint]: ConnectedPeer<Message, PeerData> };
  _connectedPeersGauge: Gauge;
  _connectingPeers: { [endpoint: Endpoint]: boolean };
  _connectingPeersGauge: Gauge;
  _unconnectedPeers: Set<Endpoint>;
  _endpointBlacklist: Set<Endpoint>;
  _reverseBlacklist: { [endpoint: Endpoint]: Endpoint };
  _badEndpoints: Set<Endpoint>;
  _permanentBlacklist: Set<Endpoint>;
  _previousHealth: { [endpoint: Endpoint]: PeerHealth };
  _seeds: Set<Endpoint>;
  _peerSeeds: Set<Endpoint>;

  _listenTCP: ?ListenTCP;
  _tcpServer: ?net.Server;

  _connectPeersTimeout: ?TimeoutID;
  _subscription: ?Subscription;

  __negotiate: (peer: Peer<Message>) => Promise<NegotiateResult<PeerData>>;
  __checkPeerHealth: (
    connectedPeer: ConnectedPeer<Message, PeerData>,
    previousHealth?: PeerHealth,
  ) => PeerHealth;
  __createMessageTransform: () => Duplex;
  __onMessageReceived: (
    peer: ConnectedPeer<Message, PeerData>,
    message: Message,
  ) => void;
  __onRequestEndpoints: () => void;
  __onEvent: OnEvent<Message, PeerData>;

  constructor(options: NetworkOptions<Message, PeerData, PeerHealth>) {
    const { environment, options$ } = options;
    this._monitor = options.monitor.at('neo_one_node_network');
    this._started = false;
    this._stopped = false;

    this._externalEndpoints = EXTERNAL_ENDPOINTS;
    this._maxConnectedPeers = MAX_CONNECTED_PEERS;
    this._connectPeersDelayMS = CONNECT_PEERS_DELAY_MS;
    this._options$ = options$;
    this._socketTimeoutMS = SOCKET_TIMEOUT_MS;
    this._connectErrorCodes = CONNECT_ERROR_CODES;

    this._connectedPeers = {};
    this._connectedPeersGauge = this._monitor.getGauge({
      name: 'connected_peers_total',
      help: 'Total number of currently connected peers',
    });
    this._connectingPeers = {};
    this._connectingPeersGauge = this._monitor.getGauge({
      name: 'connecting_peers_total',
      help: 'Total number of connecting peers',
    });
    this._unconnectedPeers = new Set();
    this._endpointBlacklist = new Set();
    this._reverseBlacklist = {};
    this._badEndpoints = new Set();
    this._permanentBlacklist = new Set();
    this._previousHealth = {};
    this._seeds = new Set();
    this._peerSeeds = new Set();

    this._listenTCP = environment.listenTCP;
    this._tcpServer = null;

    this._connectPeersTimeout = null;

    this.__negotiate = options.negotiate;
    this.__checkPeerHealth = options.checkPeerHealth;
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

    this._monitor.captureLogSingle(
      () => {
        try {
          this._subscription = this._options$.subscribe({
            next: options => {
              this._seeds = new Set(options.seeds);
              this._peerSeeds = new Set(options.peerSeeds || []);
              options.seeds.forEach(seed => this.addEndpoint(seed));
              this._maxConnectedPeers =
                options.maxConnectedPeers == null
                  ? MAX_CONNECTED_PEERS
                  : options.maxConnectedPeers;
              this._externalEndpoints =
                options.externalEndpoints == null
                  ? EXTERNAL_ENDPOINTS
                  : new Set(options.externalEndpoints);
              this._connectPeersDelayMS =
                options.connectPeersDelayMS == null
                  ? CONNECT_PEERS_DELAY_MS
                  : options.connectPeersDelayMS;
              this._socketTimeoutMS =
                options.socketTimeoutMS == null
                  ? SOCKET_TIMEOUT_MS
                  : options.socketTimeoutMS;
              this._connectErrorCodes =
                options.connectErrorCodes == null
                  ? CONNECT_ERROR_CODES
                  : new Set(options.connectErrorCodes);
            },
          });
          this._startServer();
          this._run();
        } catch (error) {
          this._started = false;
          throw error;
        }
      },
      {
        name: 'network_start',
        message: 'Network started.',
        error: 'Network failed to start.',
      },
    );
  }

  stop(): void {
    if (this._stopped || !this._started) {
      return;
    }
    this._stopped = true;

    this._monitor.captureLogSingle(
      () => {
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

          if (this._subscription != null) {
            this._subscription.unsubscribe();
          }

          this._started = false;
        } catch (error) {
          this._stopped = false;
          throw error;
        }
      },
      {
        name: 'network_stop',
        message: 'Network stopped.',
        error: 'Network failed to stop cleanly.',
      },
    );
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

  blacklistAndClose(peer: ConnectedPeer<Message, PeerData>): void {
    this._badEndpoints.add(peer.endpoint);
    peer.close();
  }

  permanentlyBlacklist(endpoint: Endpoint): void {
    this._permanentBlacklist.add(endpoint);
  }

  _startServer(): void {
    const listenTCP = this._listenTCP;
    if (listenTCP == null) {
      return;
    }

    const tcpServer = net.createServer({ pauseOnConnect: true }, socket => {
      const host = socket.remoteAddress;
      this._monitor
        .withData({
          [this._monitor.labels.PEER_ADDRESS]: host,
          [this._monitor.labels.PEER_PORT]: socket.remotePort,
        })
        .log({
          name: 'tcp_server_connect',
          help: 'Total number of socket connection attempts',
          level: 'verbose',
          message: `Received socket connection from ${
            host == null ? 'unknown' : host
          }`,
        });
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
      this._monitor.logError({
        name: 'tcp_server',
        message: 'TCP peer server encountered an error.',
        help: 'Uncaught TCP errors',
        error,
      });
    });
    tcpServer.on('close', () => {
      this._monitor.logSingle({
        name: 'tcp_server_close',
        message: 'TCP server closed',
      });
    });
    const host = listenTCP.host == null ? '0.0.0.0' : listenTCP.host;
    tcpServer.listen(listenTCP.port, host);

    this._monitor
      .withData({
        host,
        port: listenTCP.port,
      })
      .logSingle({
        name: 'tcp_server',
        message: `Listening on ${host}:${listenTCP.port}.`,
      });
  }

  async _run(): Promise<void> {
    this._monitor.logSingle({
      name: 'connect_loop',
      message: 'Starting connect loop...',
    });
    while (!this._stopped) {
      try {
        this._connectToPeers();
        this._checkPeerHealth();
        // eslint-disable-next-line
        await new Promise(resolve => {
          this._connectPeersTimeout = setTimeout(() => {
            this._connectPeersTimeout = null;
            resolve();
          }, this._connectPeersDelayMS);
        });
      } catch (error) {
        this._monitor.logError({
          name: 'connect_loop',
          message: 'Connect loop encountered an error',
          error,
        });
      }
    }
    this._monitor.logSingle({
      name: 'connect_loop',
      message: 'Stopped connect loop.',
    });
  }

  _connectToPeers(): void {
    const connectedPeersCount = Object.keys(this._connectedPeers).length;
    const maxConnectedPeers = this._maxConnectedPeers;
    let endpoints = [];
    if (connectedPeersCount < maxConnectedPeers) {
      const count = Math.max(
        (maxConnectedPeers - connectedPeersCount) * 2,
        maxConnectedPeers,
      );
      endpoints = endpoints.concat(
        _.shuffle(
          [...this._unconnectedPeers].filter(peer =>
            this._filterEndpoint(peer),
          ),
        ).slice(0, count),
      );

      if (endpoints.length + connectedPeersCount < maxConnectedPeers) {
        this._resetBadEndpoints();
        this.__onRequestEndpoints();
      }
    }

    endpoints
      .concat([...this._peerSeeds])
      .forEach(endpoint => this._connectToPeer({ endpoint }));
  }

  _checkPeerHealth(): void {
    for (const peer of utils.values(this._connectedPeers)) {
      const health = this.__checkPeerHealth(
        peer,
        this._previousHealth[peer.endpoint],
      );
      if (health.healthy) {
        this._previousHealth[peer.endpoint] = health;
      } else {
        this._monitor
          .withData({
            [this._monitor.labels.PEER_ADDRESS]: peer.endpoint,
          })
          .log({
            name: 'unhealthy_peer',
            message: `Peer at ${peer.endpoint} is unhealthy.`,
            level: 'verbose',
          });
        this.blacklistAndClose(peer);
      }
    }
  }

  _resetBadEndpoints() {
    this._badEndpoints = new Set();
  }

  _filterEndpoint(endpoint: Endpoint): boolean {
    return !(
      this._endpointBlacklist.has(endpoint) ||
      this._badEndpoints.has(endpoint) ||
      this._permanentBlacklist.has(endpoint) ||
      this._connectingPeers[endpoint] ||
      this._connectedPeers[endpoint] != null
    );
  }

  _shouldConnect(endpoint: Endpoint): boolean {
    if (this._peerSeeds.has(endpoint)) {
      return (
        !this._endpointBlacklist.has(endpoint) &&
        !this._connectingPeers[endpoint] &&
        this._connectedPeers[endpoint] == null
      );
    }

    return this._filterEndpoint(endpoint);
  }

  async _connectToPeer({
    endpoint: endpointIn,
    socket,
  }: {|
    endpoint: Endpoint,
    socket?: net.Socket,
  |}): Promise<void> {
    const endpoint = normalizeEndpoint(endpointIn);
    if (!this._shouldConnect(endpoint)) {
      return;
    }
    this._connectingPeers[endpoint] = true;
    this._connectingPeersGauge.inc();

    try {
      await this._monitor
        .withData({
          [this._monitor.labels.PEER_ADDRESS]: endpoint,
        })
        .captureLog(
          async () => {
            const endpointConfig = getEndpointConfig(endpoint);
            if (endpointConfig.type === 'tcp') {
              await this._startPeerConnection(
                this._createTCPPeer(endpoint, socket),
                true,
              );
            } else {
              throw new UnsupportedEndpointType(endpoint);
            }
          },
          {
            name: 'peer_connect',
            message: `Connecting to peer at ${endpoint}`,
            level: 'verbose',
            error: `Failed to connect to peer at ${endpoint}.`,
          },
        );
    } catch (error) {
      if (this._connectErrorCodes.has(error.code)) {
        this._badEndpoints.add(endpoint);
      }
    } finally {
      delete this._connectingPeers[endpoint];
      this._connectingPeersGauge.dec();
    }
  }

  async _startPeerConnection(
    peer: Peer<Message>,
    blacklist?: boolean,
  ): Promise<void> {
    try {
      await peer.connect();
    } catch (error) {
      if (!this._seeds.has(peer.endpoint)) {
        this._unconnectedPeers.delete(peer.endpoint);
      }
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
      this._connectedPeersGauge.inc();
      connectedPeer.peer.streamData(message =>
        this.__onMessageReceived(connectedPeer, message),
      );

      this.__onEvent({
        event: 'PEER_CONNECT_SUCCESS',
        connectedPeer,
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
    this._monitor
      .withData({
        [this._monitor.labels.PEER_ADDRESS]: peer.endpoint,
      })
      .logError({
        name: 'peer',
        help: 'Total number of unexpected peer errors',
        message: `Encountered error with peer at ${peer.endpoint}.`,
        error,
      });
  }

  _onClose(peer: Peer<Message>): void {
    const connectedPeer = this._connectedPeers[peer.endpoint];
    delete this._previousHealth[peer.endpoint];
    delete this._connectedPeers[peer.endpoint];
    this._connectedPeersGauge.set(Object.keys(this._connectedPeers).length);
    delete this._connectingPeers[peer.endpoint];
    this._connectingPeersGauge.set(Object.keys(this._connectedPeers).length);
    const endpoint = this._reverseBlacklist[peer.endpoint];
    if (endpoint != null) {
      delete this._reverseBlacklist[peer.endpoint];
      this._endpointBlacklist.delete((endpoint: $FlowFixMe));
    }
    this._monitor
      .withData({
        [this._monitor.labels.PEER_ADDRESS]: peer.endpoint,
      })
      .log({
        name: 'peer_closed',
        help:
          'Total number of times a peer was closed due to error or ending the socket.',
        message: `Peer closed at ${peer.endpoint}`,
        level: 'verbose',
      });
    this.__onEvent({
      event: 'PEER_CLOSED',
      peer: connectedPeer || peer,
    });
  }
}
