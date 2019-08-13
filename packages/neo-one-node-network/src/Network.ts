import { nodeLogger } from '@neo-one/logger';
import {
  ConnectedPeer,
  createEndpoint,
  Endpoint,
  getEndpointConfig,
  NegotiateResult,
  NetworkCreateOptions,
  OnNetworkEvent,
  Peer,
  PeerHealthBase,
} from '@neo-one/node-core';
import { Labels, utils } from '@neo-one/utils';
import { AggregationType, globalStats, MeasureUnit } from '@opencensus/core';
import _ from 'lodash';
import * as net from 'net';
import { Observable, Subscription } from 'rxjs';
import { Duplex } from 'stream';
import { UnsupportedEndpointType } from './errors';
import { TCPPeer } from './TCPPeer';

const logger = nodeLogger.child({ component: 'network' });

export interface ListenTCP {
  readonly port: number;
  readonly host?: string;
}

export interface NetworkEnvironment {
  readonly listenTCP?: ListenTCP;
}

export interface NetworkOptions {
  readonly seeds?: readonly Endpoint[];
  readonly peerSeeds?: readonly Endpoint[];
  readonly maxConnectedPeers?: number;
  readonly externalEndpoints?: readonly Endpoint[];
  readonly connectPeersDelayMS?: number;
  readonly socketTimeoutMS?: number;
  readonly connectErrorCodes?: readonly string[];
}

interface NetworkConstructOptions<Message, PeerData, PeerHealth extends PeerHealthBase>
  extends NetworkCreateOptions<Message, PeerData, PeerHealth> {
  readonly environment?: NetworkEnvironment;
  readonly options$: Observable<NetworkOptions>;
}

const emptyFunction = () => {
  // do nothing
};

const normalizeEndpoint = (endpoint: Endpoint) => {
  const { type, host, port } = getEndpointConfig(endpoint);

  return createEndpoint({
    type,
    host: host === 'localhost' ? '::' : host,
    port,
  });
};

const EXTERNAL_ENDPOINTS = new Set<string>();
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

const peersClosed = globalStats.createMeasureInt64('peers/closed', MeasureUnit.UNIT);
const peersTotal = globalStats.createMeasureInt64('peers/total', MeasureUnit.UNIT);
const peersFailed = globalStats.createMeasureInt64('peers/failures', MeasureUnit.UNIT);
const peersConnected = globalStats.createMeasureInt64('peers/connected', MeasureUnit.UNIT);
const peersConnecting = globalStats.createMeasureInt64('peers/connecting', MeasureUnit.UNIT);

const NEO_NETWORK_PEER_CLOSED_TOTAL = globalStats.createView(
  'neo_network_peer_closed_total',
  peersClosed,
  AggregationType.COUNT,
  [],
  'Total number of times a peer was closed due to error or ending the socket.',
);
globalStats.registerView(NEO_NETWORK_PEER_CLOSED_TOTAL);

const NEO_NETWORK_PEER_CONNECT_TOTAL = globalStats.createView(
  'neo_network_peer_connect_total',
  peersTotal,
  AggregationType.COUNT,
  [],
  'total number of peer connections received',
);
globalStats.registerView(NEO_NETWORK_PEER_CONNECT_TOTAL);

const NEO_NETWORK_PEER_CONNECT_FAILURES_TOTAL = globalStats.createView(
  'neo_network_peer_connect_failures_total',
  peersFailed,
  AggregationType.COUNT,
  [],
  'total number of failed peer connections',
);
globalStats.registerView(NEO_NETWORK_PEER_CONNECT_FAILURES_TOTAL);

const NEO_NETWORK_CONNECTED_PEERS_TOTAL = globalStats.createView(
  'neo_network_connected_peers_total',
  peersConnected,
  AggregationType.LAST_VALUE,
  [],
  'number of currently connected peers',
);
globalStats.registerView(NEO_NETWORK_CONNECTED_PEERS_TOTAL);

const NEO_NETWORK_CONNECTING_PEERS_TOTAL = globalStats.createView(
  'neo_network_connecting_peers_total',
  peersConnecting,
  AggregationType.LAST_VALUE,
  [],
  'number of currently connecting peers',
);
globalStats.registerView(NEO_NETWORK_CONNECTING_PEERS_TOTAL);

export class Network<Message, PeerData, PeerHealth extends PeerHealthBase> {
  private mutableStarted: boolean;
  private mutableStopped: boolean;
  private mutableExternalEndpoints: Set<Endpoint>;
  private mutableMaxConnectedPeers: number;
  private mutableConnectPeersDelayMS: number;
  private readonly options$: Observable<NetworkOptions>;
  private mutableSocketTimeoutMS: number;
  private mutableConnectErrorCodes: Set<string>;
  // tslint:disable prefer-readonly
  private mutableConnectedPeers: { readonly [E in string]?: ConnectedPeer<Message, PeerData> };
  private mutableConnectingPeers: { readonly [E in string]?: boolean };
  private mutableReverseBlacklist: { readonly [E in string]?: Endpoint };
  private mutablePreviousHealth: { readonly [E in string]?: PeerHealth };
  // tslint:enable prefer-readonly
  private readonly unconnectedPeers: Set<Endpoint>;
  private readonly endpointBlacklist: Set<Endpoint>;
  private mutableBadEndpoints: Set<Endpoint>;
  private readonly permanentBlacklist: Set<Endpoint>;
  private mutableSeeds: Set<Endpoint>;
  private mutablePeerSeeds: Set<Endpoint>;
  private readonly listenTCP: ListenTCP | undefined;
  private mutableTCPServer: net.Server | undefined;
  private mutableConnectPeersTimeout: number | undefined;
  private mutableSubscription: Subscription | undefined;
  private readonly negotiateInternal: (peer: Peer<Message>) => Promise<NegotiateResult<PeerData>>;
  private readonly checkPeerHealthInternal: (
    connectedPeer: ConnectedPeer<Message, PeerData>,
    previousHealth?: PeerHealth,
  ) => PeerHealth;
  private readonly createMessageTransformInternal: () => Duplex;
  private readonly onMessageReceivedInternal: (peer: ConnectedPeer<Message, PeerData>, message: Message) => void;
  private readonly onRequestEndpointsInternal: () => void;
  private readonly onEventInternal: OnNetworkEvent<Message, PeerData>;

  public constructor(options: NetworkConstructOptions<Message, PeerData, PeerHealth>) {
    const { environment = {}, options$ } = options;
    this.mutableStarted = false;
    this.mutableStopped = false;

    this.mutableExternalEndpoints = EXTERNAL_ENDPOINTS;
    this.mutableMaxConnectedPeers = MAX_CONNECTED_PEERS;
    this.mutableConnectPeersDelayMS = CONNECT_PEERS_DELAY_MS;
    this.options$ = options$;
    this.mutableSocketTimeoutMS = SOCKET_TIMEOUT_MS;
    this.mutableConnectErrorCodes = CONNECT_ERROR_CODES;

    this.mutableConnectedPeers = {};
    this.mutableConnectingPeers = {};
    this.unconnectedPeers = new Set();
    this.endpointBlacklist = new Set();
    this.mutableReverseBlacklist = {};
    this.mutableBadEndpoints = new Set();
    this.permanentBlacklist = new Set();
    this.mutablePreviousHealth = {};
    this.mutableSeeds = new Set();
    this.mutablePeerSeeds = new Set();

    this.listenTCP = environment.listenTCP;

    this.negotiateInternal = options.negotiate;
    this.checkPeerHealthInternal = options.checkPeerHealth;
    this.createMessageTransformInternal = options.createMessageTransform;
    this.onMessageReceivedInternal = options.onMessageReceived;
    this.onRequestEndpointsInternal = options.onRequestEndpoints;
    this.onEventInternal = options.onEvent === undefined ? emptyFunction : options.onEvent;

    this.onError = this.onError.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  public start(): void {
    if (this.mutableStarted) {
      return;
    }
    this.mutableStarted = true;
    this.mutableStopped = false;
    try {
      this.mutableSubscription = this.options$.subscribe({
        next: (options) => {
          this.mutableSeeds = new Set(options.seeds);
          this.mutablePeerSeeds = new Set(options.peerSeeds === undefined ? [] : options.peerSeeds);
          if (options.seeds !== undefined) {
            options.seeds.forEach((seed) => this.addEndpoint(seed));
          }
          this.mutableMaxConnectedPeers =
            options.maxConnectedPeers === undefined ? MAX_CONNECTED_PEERS : options.maxConnectedPeers;
          this.mutableExternalEndpoints =
            options.externalEndpoints === undefined ? EXTERNAL_ENDPOINTS : new Set(options.externalEndpoints);
          this.mutableConnectPeersDelayMS =
            options.connectPeersDelayMS === undefined ? CONNECT_PEERS_DELAY_MS : options.connectPeersDelayMS;
          this.mutableSocketTimeoutMS =
            options.socketTimeoutMS === undefined ? SOCKET_TIMEOUT_MS : options.socketTimeoutMS;
          this.mutableConnectErrorCodes =
            options.connectErrorCodes === undefined ? CONNECT_ERROR_CODES : new Set(options.connectErrorCodes);
        },
        error: () => {
          // do nothing
        },
      });

      this.startServer();
      // tslint:disable-next-line no-floating-promises
      this.run();
      logger.info({ title: 'neo_network_start' }, 'Network started.');
    } catch (error) {
      logger.error({ title: 'neo_network_start', error }, 'Network failed to start.');
      this.mutableStarted = false;
      throw error;
    }
  }

  public stop(): void {
    if (this.mutableStopped || !this.mutableStarted) {
      return;
    }
    this.mutableStopped = true;
    try {
      if (this.mutableConnectPeersTimeout !== undefined) {
        clearTimeout(this.mutableConnectPeersTimeout);
        this.mutableConnectPeersTimeout = undefined;
      }

      Object.keys(this.mutableConnectedPeers).forEach((endpoint) => {
        const peer = this.mutableConnectedPeers[endpoint];
        if (peer !== undefined) {
          peer.close();
          const { [peer.endpoint]: _unused, ...mutableConnectedPeers } = this.mutableConnectedPeers;
          this.mutableConnectedPeers = mutableConnectedPeers;
        }
      });

      if (this.mutableTCPServer !== undefined) {
        this.mutableTCPServer.close();
      }

      if (this.mutableSubscription !== undefined) {
        this.mutableSubscription.unsubscribe();
      }

      this.mutableStarted = false;
      logger.info({ title: 'neo_network_stop' }, 'Network stopped.');
    } catch (error) {
      this.mutableStopped = false;
      logger.error({ title: 'neo_network_stop', error }, 'Network failed to stop cleanly');
      throw error;
    }
  }

  public addEndpoint(endpoint: Endpoint): void {
    if (!this.mutableExternalEndpoints.has(endpoint)) {
      this.unconnectedPeers.add(endpoint);
    }
  }

  public relay(buffer: Buffer): void {
    Object.values(this.mutableConnectedPeers).forEach((peer) => {
      if (peer !== undefined && peer.relay) {
        peer.write(buffer);
      }
    });
  }

  public get connectedPeers(): ReadonlyArray<ConnectedPeer<Message, PeerData>> {
    return Object.values(this.mutableConnectedPeers).filter(utils.notNull);
  }

  public blacklistAndClose(peer: ConnectedPeer<Message, PeerData>): void {
    this.mutableBadEndpoints.add(peer.endpoint);
    peer.close();
  }

  public permanentlyBlacklist(endpoint: Endpoint): void {
    this.permanentBlacklist.add(endpoint);
  }

  private startServer(): void {
    const listenTCP = this.listenTCP;
    if (listenTCP === undefined) {
      return;
    }

    const tcpServer = net.createServer({ pauseOnConnect: true }, (socket) => {
      const { remoteAddress, remotePort } = socket;
      logger.debug(
        {
          [Labels.PEER_ADDRESS]: remoteAddress,
          [Labels.PEER_PORT]: remotePort,
          title: 'tcp_server_connect',
        },
        `Received socket connection from ${remoteAddress === undefined ? 'unknown' : remoteAddress}`,
      );

      if (remoteAddress === undefined || remotePort === undefined) {
        socket.end();

        return;
      }
      const endpoint = createEndpoint({
        type: 'tcp',
        host: remoteAddress,
        port: remotePort,
      });

      // tslint:disable-next-line no-floating-promises
      this.connectToPeer({ endpoint, socket });
    });
    this.mutableTCPServer = tcpServer;
    tcpServer.on('error', (error) => {
      logger.error({ title: 'tcp_server_uncaught_error', error }, 'TCP peer server encountered an error.');
    });
    tcpServer.on('close', () => {
      logger.info({ title: 'tcp_server_close' }, 'TCP server closed');
    });
    const host = listenTCP.host === undefined ? '0.0.0.0' : listenTCP.host;
    tcpServer.listen(listenTCP.port, host);

    logger.info(
      {
        host,
        port: listenTCP.port,
        title: 'tcp_server_listen',
      },
      `Listening on ${host}:${listenTCP.port}.`,
    );
  }

  private async run(): Promise<void> {
    logger.info({ title: 'neo_network_connect_loop_start' }, 'Starting connect loop...');

    // tslint:disable-next-line no-loop-statement
    while (!this.mutableStopped) {
      try {
        this.connectToPeers();
        this.checkPeerHealth();
        await new Promise<void>((resolve) => {
          this.mutableConnectPeersTimeout = setTimeout(() => {
            this.mutableConnectPeersTimeout = undefined;
            resolve();
            // tslint:disable-next-line no-any
          }, this.mutableConnectPeersDelayMS) as any;
        });
      } catch (error) {
        logger.error({ title: 'neo_network_connect_loop_error', error }, 'Connect loop encountered an error');
      }
    }
    logger.info({ title: 'neo_network_connect_loop_stop' }, 'Stopped connect loop.');
  }

  private connectToPeers(): void {
    const connectedPeersCount = Object.keys(this.mutableConnectedPeers).length;
    const maxConnectedPeers = this.mutableMaxConnectedPeers;
    let endpoints: Endpoint[] = [];
    if (connectedPeersCount < maxConnectedPeers) {
      const count = Math.max((maxConnectedPeers - connectedPeersCount) * 2, maxConnectedPeers);

      endpoints = endpoints.concat(
        _.shuffle([...this.unconnectedPeers].filter((peer) => this.filterEndpoint(peer))).slice(0, count),
      );

      if (endpoints.length + connectedPeersCount < maxConnectedPeers) {
        this.resetBadEndpoints();
        this.onRequestEndpointsInternal();
      }
    }

    // tslint:disable-next-line promise-function-async
    endpoints.concat([...this.mutablePeerSeeds]).forEach((endpoint) => this.connectToPeer({ endpoint }));
  }

  private checkPeerHealth(): void {
    Object.values(this.mutableConnectedPeers)
      .filter(utils.notNull)
      .forEach((peer) => {
        const health = this.checkPeerHealthInternal(peer, this.mutablePreviousHealth[peer.endpoint]);

        if (health.healthy) {
          this.mutablePreviousHealth = {
            ...this.mutablePreviousHealth,
            [peer.endpoint]: health,
          };
        } else {
          logger.debug(
            {
              title: 'neo_network_unhealthy_peer',
              [Labels.PEER_ADDRESS]: peer.endpoint,
            },
            `Peer at ${peer.endpoint} is unhealthy.`,
          );

          this.blacklistAndClose(peer);
        }
      });
  }

  private resetBadEndpoints() {
    this.mutableBadEndpoints = new Set();
  }

  private filterEndpoint(endpoint: Endpoint): boolean {
    return !(
      this.endpointBlacklist.has(endpoint) ||
      this.mutableBadEndpoints.has(endpoint) ||
      this.permanentBlacklist.has(endpoint) ||
      this.mutableConnectingPeers[endpoint] ||
      this.mutableConnectedPeers[endpoint] !== undefined
    );
  }

  private shouldConnect(endpoint: Endpoint): boolean {
    if (this.mutablePeerSeeds.has(endpoint)) {
      return (
        !this.endpointBlacklist.has(endpoint) &&
        !this.mutableConnectingPeers[endpoint] &&
        this.mutableConnectedPeers[endpoint] === undefined
      );
    }

    return this.filterEndpoint(endpoint);
  }

  private async connectToPeer({
    endpoint: endpointIn,
    socket,
  }: {
    readonly endpoint: Endpoint;
    readonly socket?: net.Socket;
  }): Promise<void> {
    const endpoint = normalizeEndpoint(endpointIn);
    if (!this.shouldConnect(endpoint)) {
      return;
    }
    this.mutableConnectingPeers = {
      ...this.mutableConnectingPeers,
      [endpoint]: true,
    };
    globalStats.record([
      {
        measure: peersConnecting,
        value: 1,
      },
    ]);

    const logData = { [Labels.PEER_ADDRESS]: endpoint, title: 'neo_network_peer_connect' };
    try {
      const endpointConfig = getEndpointConfig(endpoint);
      if (endpointConfig.type === 'tcp') {
        await this.startPeerConnection(this.createTCPPeer(endpoint, socket), true);
      } else {
        throw new UnsupportedEndpointType(endpoint);
      }

      logger.trace(logData, `Connecting to peer at ${endpoint}`);
    } catch (error) {
      logger.trace({ error, ...logData }, `Failed to connect to peer at ${endpoint}.`);
      globalStats.record([
        {
          measure: peersFailed,
          value: 1,
        },
      ]);
      if (this.mutableConnectErrorCodes.has(error.code)) {
        this.mutableBadEndpoints.add(endpoint);
      }
    } finally {
      const { [endpoint]: _unused, ...rest } = this.mutableConnectingPeers;
      this.mutableConnectingPeers = rest;
      globalStats.record([
        {
          measure: peersConnecting,
          value: -1,
        },
      ]);
    }
  }

  private async startPeerConnection(peer: Peer<Message>, blacklist?: boolean): Promise<void> {
    try {
      await peer.connect();
    } catch (error) {
      if (!this.mutableSeeds.has(peer.endpoint)) {
        this.unconnectedPeers.delete(peer.endpoint);
      }
      throw error;
    }

    let data;
    let relay;
    try {
      const result = await this.negotiateInternal(peer);
      // eslint-disable-next-line
      data = result.data;
      // eslint-disable-next-line
      relay = result.relay;
    } catch (error) {
      if (typeof error.code === 'string' && error.code === 'ALREADY_CONNECTED' && blacklist) {
        this.endpointBlacklist.add(peer.endpoint);
        this.mutableReverseBlacklist = {
          ...this.mutableReverseBlacklist,
          [error.endpoint]: peer.endpoint,
        };
      }
      peer.close();
      throw error;
    }

    if (peer.connected) {
      const connectedPeer = new ConnectedPeer({ peer, data, relay });
      this.mutableConnectedPeers = {
        ...this.mutableConnectedPeers,
        [peer.endpoint]: connectedPeer,
      };
      globalStats.record([
        {
          measure: peersConnected,
          value: 1,
        },
      ]);
      connectedPeer.peer.streamData((message) => this.onMessageReceivedInternal(connectedPeer, message));

      this.onEventInternal({
        event: 'PEER_CONNECT_SUCCESS',
        connectedPeer,
      });
    }
  }

  private createTCPPeer(endpoint: Endpoint, socket?: net.Socket): TCPPeer<Message> {
    return new TCPPeer({
      endpoint,
      socket,
      transform: this.createMessageTransformInternal(),
      timeoutMS: this.mutableSocketTimeoutMS,
      onError: this.onError,
      onClose: this.onClose,
    });
  }

  private onError(peer: Peer<Message>, error: Error): void {
    logger.trace(
      { [Labels.PEER_ADDRESS]: peer.endpoint, title: 'neo_network_peer_error', error },
      `Encountered error with peer at ${peer.endpoint}.`,
    );
  }

  private onClose(peer: Peer<Message>): void {
    const connectedPeer = this.mutableConnectedPeers[peer.endpoint];

    const { [peer.endpoint]: _unused, ...mutablePreviousHealth } = this.mutablePreviousHealth;
    this.mutablePreviousHealth = mutablePreviousHealth;

    const { [peer.endpoint]: _unused1, ...mutableConnectedPeers } = this.mutableConnectedPeers;
    this.mutableConnectedPeers = mutableConnectedPeers;

    const { [peer.endpoint]: _unused2, ...mutableConnectingPeers } = this.mutableConnectingPeers;
    this.mutableConnectingPeers = mutableConnectingPeers;

    globalStats.record([
      {
        measure: peersConnected,
        value: Object.keys(this.mutableConnectedPeers).length,
      },
      {
        measure: peersConnecting,
        value: Object.keys(this.mutableConnectingPeers).length,
      },
    ]);

    const endpoint = this.mutableReverseBlacklist[peer.endpoint];
    if (endpoint !== undefined) {
      const { [peer.endpoint]: _unused3, ...mutableReverseBlacklist } = this.mutableReverseBlacklist;
      this.mutableReverseBlacklist = mutableReverseBlacklist;

      this.endpointBlacklist.delete(endpoint);
    }

    logger.debug(
      { [Labels.PEER_ADDRESS]: peer.endpoint, title: 'neo_network_peer_closed' },
      `Peer closed at ${peer.endpoint}`,
    );
    globalStats.record([
      {
        measure: peersClosed,
        value: 1,
      },
    ]);

    this.onEventInternal({
      event: 'PEER_CLOSED',
      peer: connectedPeer === undefined ? peer : connectedPeer,
    });
  }
}
