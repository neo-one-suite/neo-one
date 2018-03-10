/* @flow */
import { Address6 } from 'ip-address';
import {
  type ConnectedPeer,
  type EventMessage as NetworkEventMessage,
  type NegotiateResult,
  type NetworkEnvironment,
  type NetworkOptions,
  type Peer,
  Network,
} from '@neo-one/node-network';
import {
  TRANSACTION_TYPE,
  type Block,
  type Header,
  type Transaction,
  type UInt256Hex,
  ConsensusPayload,
  MerkleTree,
  RegisterTransaction,
  common,
  crypto,
  utils,
} from '@neo-one/client-core';
import {
  type Blockchain,
  type Endpoint,
  type Node as INode,
  createEndpoint,
  getEndpointConfig,
} from '@neo-one/node-core';
import BloomFilter from 'bloom-filter';
import LRU from 'lru-cache';
import type { Observable } from 'rxjs/Observable';
import { ScalingBloem } from 'bloem';

import _ from 'lodash';
import { createReadClient } from '@neo-one/client';
import { defer } from 'rxjs/observable/defer';
import { distinctUntilChanged, map, switchMap, take } from 'rxjs/operators';
import { empty } from 'rxjs/observable/empty';
import { merge } from 'rxjs/observable/merge';
import { finalize, neverComplete, utils as commonUtils } from '@neo-one/utils';
import { timer } from 'rxjs/observable/timer';

import { COMMAND } from './Command';
import {
  INVENTORY_TYPE,
  SERVICES,
  AddrPayload,
  FilterAddPayload,
  FilterLoadPayload,
  GetBlocksPayload,
  HeadersPayload,
  InvPayload,
  MerkleBlockPayload,
  NetworkAddress,
  VersionPayload,
} from './payload';
import { type ConsensusOptions, Consensus } from './consensus';
import Message, { type MessageValue, MessageTransform } from './Message';
import { AlreadyConnectedError, NegotiationError } from './errors';
import { type PeerData } from './PeerData';

import pkg from '../package.json';

export type Environment = {|
  network: NetworkEnvironment,
|};
export type Options = {|
  consensus: {|
    enabled: boolean,
    options: ConsensusOptions,
  |},
  network: NetworkOptions,
  rpcURLs: Array<string>,
|};

const createPeerBloomFilter = ({
  filter,
  k,
  tweak,
}: {
  filter: Buffer,
  k: number,
  tweak: number,
}) =>
  new BloomFilter({
    vData: Buffer.from(filter),
    nHashFuncs: k,
    nTweak: tweak,
  });

const createScalingBloomFilter = () =>
  new ScalingBloem(0.05, {
    initial_capacity: 100000,
    scaling: 4,
  });

const MEM_POOL_SIZE = 30000;
const GET_ADDR_PEER_COUNT = 200;
const GET_BLOCKS_COUNT = 500;
// Assume that we get 500 back, but if not, at least request every 10 seconds
const GET_BLOCKS_BUFFER = GET_BLOCKS_COUNT / 3;
const GET_BLOCKS_TIME_MS = 5000;
const GET_BLOCKS_THROTTLE_MS = 500;
const GET_BLOCKS_CLOSE_COUNT = 2;
const UNHEALTHY_PEER_SECONDS = 120 * 60;
const LOCAL_HOST_ADDRESSES = new Set([
  '',
  '0.0.0.0',
  'localhost',
  '127.0.0.1',
  '::',
  '::1',
]);

type PeerHealth = {
  healthy: boolean,
  blockIndex: number,
  checkTimeSeconds: number,
};

export default class Node implements INode {
  blockchain: Blockchain;
  _network: Network<Message, PeerData, PeerHealth>;
  _consensus: ?Consensus;
  _options$: Observable<Options>;

  _externalPort: number;
  _nonce: number;
  _userAgent: string;

  memPool: { [hash: UInt256Hex]: Transaction };
  _knownBlockHashes: ScalingBloem;
  _tempKnownBlockHashes: Set<UInt256Hex>;
  _knownTransactionHashes: ScalingBloem;
  _tempKnownTransactionHashes: Set<UInt256Hex>;
  _knownHeaderHashes: ScalingBloem;
  _tempKnownHeaderHashes: Set<UInt256Hex>;
  _fetchedIndex: number;
  _getBlocksRequestsIndex: ?number;
  _getBlocksRequestTime: ?number;
  _getBlocksRequestsCount: number;
  _bestPeer: ?ConnectedPeer<Message, PeerData>;
  _consensusCache: LRU;
  _blockIndex: { [endpoint: Endpoint]: number };

  constructor({
    blockchain,
    environment,
    options$,
  }: {|
    blockchain: Blockchain,
    environment: Environment,
    options$: Observable<Options>,
  |}) {
    this.blockchain = blockchain;
    this._network = new Network({
      environment: environment.network,
      options$: options$.pipe(
        map(options => options.network),
        distinctUntilChanged(),
      ),
      negotiate: this._negotiate,
      checkPeerHealth: this._checkPeerHealth,
      createMessageTransform: () =>
        new MessageTransform(this.blockchain.deserializeWireContext),
      onMessageReceived: this._onMessageReceived.bind(this),
      onRequestEndpoints: this._onRequestEndpoints.bind(this),
      onEvent: this._onEvent,
    });
    this._consensus = null;
    this._options$ = options$;

    this._externalPort = (environment.network.listenTCP || {}).port || 0;
    this._nonce = Math.floor(Math.random() * utils.UINT_MAX_NUMBER);
    this._userAgent = `NEO:neo-one-js:${pkg.version}`;

    this.memPool = {};
    this._knownBlockHashes = createScalingBloomFilter();
    this._tempKnownBlockHashes = new Set();
    this._knownTransactionHashes = createScalingBloomFilter();
    this._tempKnownTransactionHashes = new Set();
    this._knownHeaderHashes = createScalingBloomFilter();
    this._tempKnownHeaderHashes = new Set();
    this._getBlocksRequestsIndex = null;
    this._getBlocksRequestTime = null;
    this._getBlocksRequestsCount = 1;
    this._consensusCache = LRU(10000);
    this._blockIndex = {};
  }

  get connectedPeers(): Array<Endpoint> {
    return this._network.connectedPeers.map(peer => peer.endpoint);
  }

  start(): Observable<*> {
    const network$ = defer(async () => {
      this.blockchain.log({ event: 'NODE_START' });
      this._network.start();
    }).pipe(
      neverComplete(),
      finalize(() => {
        this.blockchain.log({ event: 'NODE_STOP' });
        this._network.stop();
      }),
    );
    const consensus$ = this._options$.pipe(
      map(options => options.consensus.enabled),
      distinctUntilChanged(),
      switchMap(enabled => {
        if (enabled) {
          const consensus = new Consensus({
            options$: this._options$.pipe(
              map(options => options.consensus.options),
              distinctUntilChanged(),
            ),
            node: this,
          });
          this._consensus = consensus;
          return timer(5000).pipe(switchMap(() => consensus.start$()));
        }
        return empty();
      }),
    );

    return merge(network$, consensus$);
  }

  async relayTransaction(transaction: Transaction): Promise<void> {
    if (
      transaction.type === TRANSACTION_TYPE.MINER ||
      this.memPool[transaction.hashHex] != null ||
      this._tempKnownTransactionHashes.has(transaction.hashHex)
    ) {
      return;
    }

    if (!this._knownTransactionHashes.has(transaction.hash)) {
      const hash = common.uInt256ToString(transaction.hash);
      this.blockchain.log({
        event: 'RELAY_TRANSACTION_START',
        level: 'debug',
        hash,
      });

      this._tempKnownTransactionHashes.add(transaction.hashHex);

      try {
        const foundTransaction = await this.blockchain.transaction.tryGet({
          hash: transaction.hash,
        });
        if (foundTransaction == null) {
          await this.blockchain.verifyTransaction({
            transaction,
            memPool: commonUtils.values(this.memPool),
          });
          this.memPool[transaction.hashHex] = transaction;
          if (this._consensus != null) {
            this._consensus.onTransactionReceived(transaction);
          }
          this._relayTransaction(transaction);
          this.blockchain.log({
            event: 'RELAY_TRANSACTION_SUCCESS',
            level: 'debug',
            hash,
          });
          await this._trimMemPool();
        }

        this._knownTransactionHashes.add(transaction.hash);
      } catch (error) {
        if (error.code !== 'VERIFY') {
          this.blockchain.log({
            event: 'RELAY_TRANSACTION_ERROR',
            hash,
            error,
          });

          throw error;
        }
      } finally {
        this._tempKnownTransactionHashes.delete(transaction.hashHex);
      }
    }
  }

  async relayBlock(block: Block): Promise<void> {
    this.blockchain.log({
      event: 'RELAY_BLOCK',
      hash: common.uInt256ToString(block.hash),
      index: block.index,
    });
    await this._persistBlock(block);
  }

  relayConsensusPayload(payload: ConsensusPayload): void {
    const message = this._createMessage({
      command: COMMAND.INV,
      payload: new InvPayload({
        type: INVENTORY_TYPE.CONSENSUS,
        hashes: [payload.hash],
      }),
    });
    this._consensusCache.set(payload.hashHex, payload);
    this._relay(message);
  }

  syncMemPool(): void {
    this._relay(this._createMessage({ command: COMMAND.MEMPOOL }));
  }

  _relay(message: Message): void {
    this.blockchain.log({
      event: 'RELAY_MESSAGE',
      level: 'debug',
      command: message.value.command,
    });
    this._network.relay(message.serializeWire());
  }

  _relayTransaction(transaction: Transaction) {
    const message = this._createMessage({
      command: COMMAND.INV,
      payload: new InvPayload({
        type: INVENTORY_TYPE.TRANSACTION,
        hashes: [transaction.hash],
      }),
    });
    const messagePayload = message.serializeWire();
    for (const peer of this._network.connectedPeers) {
      if (peer.relay && this._testFilter(peer.data.bloomFilter, transaction)) {
        peer.write(messagePayload);
      }
    }
  }

  _sendMessage(
    peer: Peer<Message> | ConnectedPeer<Message, PeerData>,
    message: Message,
  ): void {
    this.blockchain.log({
      event: 'SEND_MESSAGE',
      level: 'debug',
      command: message.value.command,
      endpoint: peer.endpoint,
    });
    peer.write(message.serializeWire());
  }

  _negotiate = async (
    peer: Peer<Message>,
  ): Promise<NegotiateResult<PeerData>> => {
    this._sendMessage(
      peer,
      this._createMessage({
        command: COMMAND.VERSION,
        payload: new VersionPayload({
          protocolVersion: 0,
          services: SERVICES.NODE_NETWORK,
          timestamp: Math.round(Date.now() / 1000),
          port: this._externalPort,
          nonce: this._nonce,
          userAgent: this._userAgent,
          startHeight: this.blockchain.currentBlockIndex,
          relay: true,
        }),
      }),
    );

    const message = await peer.receiveMessage(30000);
    let versionPayload;
    if (message.value.command === COMMAND.VERSION) {
      versionPayload = message.value.payload;
    } else {
      throw new NegotiationError(message);
    }

    this._checkVersion(peer, message, versionPayload);

    const { host } = getEndpointConfig(peer.endpoint);
    let address;
    if (NetworkAddress.isValid(host)) {
      address = new NetworkAddress({
        host,
        port: versionPayload.port,
        timestamp: versionPayload.timestamp,
        services: versionPayload.services,
      });
    }

    this._sendMessage(peer, this._createMessage({ command: COMMAND.VERACK }));

    const nextMessage = await peer.receiveMessage(30000);
    if (nextMessage.value.command !== COMMAND.VERACK) {
      throw new NegotiationError(nextMessage);
    }

    return {
      data: {
        nonce: versionPayload.nonce,
        startHeight: versionPayload.startHeight,
        bloomFilter: null,
        address,
      },
      relay: versionPayload.relay,
    };
  };

  _checkPeerHealth = (
    peer: ConnectedPeer<Message, PeerData>,
    prevHealth?: PeerHealth,
  ) => {
    const checkTimeSeconds =
      prevHealth == null
        ? commonUtils.nowSeconds()
        : prevHealth.checkTimeSeconds;
    const blockIndex = this._blockIndex[peer.endpoint];
    const health = { healthy: true, checkTimeSeconds, blockIndex };
    if (
      // If first check -> healthy
      prevHealth == null ||
      // If seen new block -> healthy
      (prevHealth.blockIndex != null &&
        prevHealth.blockIndex < health.blockIndex) ||
      // If not seen a block or a new block BUT it has NOT been a long
      // time -> healthy
      ((prevHealth.blockIndex == null ||
        prevHealth.blockIndex === health.blockIndex) &&
        commonUtils.nowSeconds() - checkTimeSeconds < UNHEALTHY_PEER_SECONDS)
    ) {
      return health;
    }

    return { healthy: false, checkTimeSeconds, blockIndex };
  };

  _onEvent = (event: NetworkEventMessage<Message, PeerData>) => {
    if (event.event === 'PEER_CONNECT_SUCCESS') {
      const { connectedPeer } = event.extra;
      if (
        this._bestPeer == null ||
        // Only change best peer at most every 100 blocks
        this._bestPeer.data.startHeight + 100 < connectedPeer.data.startHeight
      ) {
        this._bestPeer = connectedPeer;
        this._resetRequestBlocks();
        this._requestBlocks();
      }
    } else if (event.event === 'PEER_CLOSED') {
      if (
        this._bestPeer != null &&
        this._bestPeer.endpoint === event.extra.peer.endpoint
      ) {
        this._bestPeer = this._findBestPeer();
        this._resetRequestBlocks();
        this._requestBlocks();
      }
    }

    this.blockchain.log({
      event: event.event,
      ...(event.data || {}),
    });
  };

  _findBestPeer(
    bestPeer?: ConnectedPeer<Message, PeerData>,
  ): ?ConnectedPeer<Message, PeerData> {
    let peers = this._network.connectedPeers;
    if (bestPeer != null) {
      peers = peers.filter(peer => peer.endpoint !== bestPeer.endpoint);
    }
    const result = _.maxBy(peers, peer => peer.data.startHeight);
    if (result == null) {
      return null;
    }
    return _.shuffle(
      peers.filter(peer => peer.data.startHeight === result.data.startHeight),
    )[0];
  }

  _requestBlocks = _.debounce(() => {
    const peer = this._bestPeer;
    const block = this.blockchain.currentBlock;
    if (peer != null) {
      if (this._getBlocksRequestsCount >= GET_BLOCKS_CLOSE_COUNT) {
        this.blockchain.log({
          event: 'REQUEST_BLOCKS_NEW_PEER',
          level: 'debug',
          peer: peer.endpoint,
        });
        this._bestPeer = this._findBestPeer(peer);
        this._getBlocksRequestsCount = 0;
        // TODO: Seems like this causes issues sometimes, try resetting here...
        this._knownBlockHashes = createScalingBloomFilter();
      } else if (this._shouldRequestBlocks()) {
        if (this._getBlocksRequestsIndex === block.index) {
          this.blockchain.log({
            event: 'REQUEST_BLOCKS_REPEAT_REQUEST',
            level: 'debug',
            peer: peer.endpoint,
            index: block.index,
            hash: block.hashHex,
          });
          this._getBlocksRequestsCount += 1;
        } else {
          this.blockchain.log({
            event: 'REQUEST_BLOCKS_INITIAL_REQUEST',
            level: 'debug',
            peer: peer.endpoint,
            index: block.index,
            hash: block.hashHex,
          });
          this._getBlocksRequestsCount = 1;
          this._getBlocksRequestsIndex = block.index;
        }
        this._getBlocksRequestTime = Date.now();
        this._sendMessage(
          peer,
          this._createMessage({
            command: COMMAND.GET_BLOCKS,
            payload: new GetBlocksPayload({
              hashStart: [block.hash],
            }),
          }),
        );
      } else {
        this.blockchain.log({
          event: 'REQUEST_BLOCKS_SKIP_REQUEST',
          level: 'debug',
          peer: peer.endpoint,
          index: block.index,
        });
      }
    }

    this._requestBlocks();
  }, GET_BLOCKS_THROTTLE_MS);

  _resetRequestBlocks(): void {
    this._getBlocksRequestsIndex = null;
    this._getBlocksRequestsCount = 0;
  }

  _shouldRequestBlocks(): boolean {
    const block = this.blockchain.currentBlock;
    const getBlocksRequestTime = this._getBlocksRequestTime;
    return (
      this._getBlocksRequestsIndex == null ||
      block.index - this._getBlocksRequestsIndex > GET_BLOCKS_BUFFER ||
      getBlocksRequestTime == null ||
      Date.now() - getBlocksRequestTime > GET_BLOCKS_TIME_MS
    );
  }

  _checkVersion(
    peer: Peer<Message>,
    message: Message,
    version: VersionPayload,
  ): void {
    if (version.nonce === this._nonce) {
      this._network.permanentlyBlacklist(peer.endpoint);
      throw new NegotiationError(message, 'Nonce equals my nonce.');
    }

    const connectedPeer = this._network.connectedPeers.find(
      otherPeer => version.nonce === otherPeer.data.nonce,
    );
    if (connectedPeer != null) {
      throw new AlreadyConnectedError(
        connectedPeer.endpoint,
        'Already connected to nonce.',
      );
    }
  }

  _ready(): boolean {
    const peer = this._bestPeer;
    const block = this.blockchain.currentBlock;
    return peer != null && block.index >= peer.data.startHeight;
  }

  _onRequestEndpoints = _.throttle((): void => {
    this._relay(this._createMessage({ command: COMMAND.GET_ADDR }));
    this._fetchEndpointsFromRPC();
  }, 5000);

  async _fetchEndpointsFromRPC(): Promise<void> {
    try {
      await this._doFetchEndpointsFromRPC();
    } catch (error) {
      this.blockchain.log({
        event: 'NODE_FETCH_ENDPOINTS_FROM_RPC_ERROR',
        error,
      });
    }
  }

  async _doFetchEndpointsFromRPC(): Promise<void> {
    const { rpcURLs } = await this._options$.pipe(take(1)).toPromise();
    await Promise.all(
      rpcURLs.map(rpcURL => this._fetchEndpointsFromRPCURL(rpcURL)),
    );
  }

  async _fetchEndpointsFromRPCURL(rpcURL: string): Promise<void> {
    const readClient = createReadClient({
      network: 'doesntmatter',
      rpcURL,
    });
    try {
      const peers = await readClient.getConnectedPeers();
      peers
        .map(peer => {
          const { address, port } = peer;
          const host = new Address6(address);
          return { host: host.canonicalForm() || '', port };
        })
        .filter(endpoint => !LOCAL_HOST_ADDRESSES.has(endpoint.host))
        .map(endpoint =>
          createEndpoint({
            type: 'tcp',
            host: endpoint.host,
            port: endpoint.port,
          }),
        )
        .forEach(endpoint => this._network.addEndpoint(endpoint));
    } catch (error) {
      this.blockchain.log({
        event: 'NODE_FETCH_ENDPOINTS_FROM_RPC_URL_ERROR',
        error,
        rpcURL,
      });
    }
  }

  _onMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    message: Message,
  ): void {
    this.blockchain.log({
      event: 'MESSAGE_RECEIVED',
      level: 'debug',
      endpoint: peer.endpoint,
      command: message.value.command,
    });

    const onError = (error: Error) => {
      this.blockchain.log({
        event: 'MESSAGE_RECEIVED_ERROR',
        error,
        endpoint: peer.endpoint,
        command: message.value.command,
      });
    };

    try {
      switch (message.value.command) {
        case COMMAND.ADDR:
          this._onAddrMessageReceived(message.value.payload);
          break;
        case COMMAND.BLOCK:
          this._onBlockMessageReceived(peer, message.value.payload).catch(
            onError,
          );
          break;
        case COMMAND.CONSENSUS:
          this._onConsensusMessageReceived(message.value.payload).catch(
            onError,
          );
          break;
        case COMMAND.FILTER_ADD:
          this._onFilterAddMessageReceived(peer, message.value.payload);
          break;
        case COMMAND.FILTER_CLEAR:
          this._onFilterClearMessageReceived(peer);
          break;
        case COMMAND.FILTER_LOAD:
          this._onFilterLoadMessageReceived(peer, message.value.payload);
          break;
        case COMMAND.GET_ADDR:
          this._onGetAddrMessageReceived(peer);
          break;
        case COMMAND.GET_BLOCKS:
          this._onGetBlocksMessageReceived(peer, message.value.payload).catch(
            onError,
          );
          break;
        case COMMAND.GET_DATA:
          this._onGetDataMessageReceived(peer, message.value.payload).catch(
            onError,
          );
          break;
        case COMMAND.GET_HEADERS:
          this._onGetHeadersMessageReceived(peer, message.value.payload).catch(
            onError,
          );
          break;
        case COMMAND.HEADERS:
          this._onHeadersMessageReceived(peer, message.value.payload).catch(
            onError,
          );
          break;
        case COMMAND.INV:
          this._onInvMessageReceived(peer, message.value.payload);
          break;
        case COMMAND.MEMPOOL:
          this._onMemPoolMessageReceived(peer);
          break;
        case COMMAND.TX:
          this._onTransactionReceived(message.value.payload).catch(onError);
          break;
        case COMMAND.VERACK:
          this._onVerackMessageReceived(peer);
          break;
        case COMMAND.VERSION:
          this._onVersionMessageReceived(peer);
          break;
        case COMMAND.ALERT:
          break;
        case COMMAND.MERKLE_BLOCK:
          break;
        case COMMAND.NOT_FOUND:
          break;
        case COMMAND.PING:
          break;
        case COMMAND.PONG:
          break;
        case COMMAND.REJECT:
          break;
        default:
          // eslint-disable-next-line
          (message.value.command: empty);
          break;
      }
    } catch (error) {
      onError(error);
    }
  }

  _onAddrMessageReceived(addr: AddrPayload): void {
    addr.addresses
      .filter(address => !LOCAL_HOST_ADDRESSES.has(address.host))
      .map(address =>
        createEndpoint({
          type: 'tcp',
          host: address.host,
          port: address.port,
        }),
      )
      .forEach(endpoint => this._network.addEndpoint(endpoint));
  }

  async _onBlockMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    block: Block,
  ): Promise<void> {
    this.blockchain.log({
      event: 'BLOCK_RECEIVED',
      level: 'debug',
      index: block.index,
    });
    this._blockIndex[peer.endpoint] = Math.max(
      block.index,
      this._blockIndex[peer.endpoint] || 0,
    );
    await this._persistBlock(block);
  }

  async _persistBlock(block: Block): Promise<void> {
    if (
      this.blockchain.currentBlockIndex >= block.index ||
      this._tempKnownBlockHashes.has(block.hashHex)
    ) {
      return;
    }

    if (!this._knownBlockHashes.has(block.hash)) {
      this._tempKnownBlockHashes.add(block.hashHex);

      try {
        const foundBlock = await this.blockchain.block.tryGet({
          hashOrIndex: block.hash,
        });
        if (foundBlock == null) {
          this.blockchain.log({
            event: 'NODE_PERSIST_BLOCK',
            level: 'debug',
            index: block.index,
          });
          await this.blockchain.persistBlock({ block });
          if (this._consensus != null) {
            this._consensus.onPersistBlock();
          }

          const peer = this._bestPeer;
          if (peer != null && block.index > peer.data.startHeight) {
            this._relay(
              this._createMessage({
                command: COMMAND.INV,
                payload: new InvPayload({
                  type: INVENTORY_TYPE.BLOCK,
                  hashes: [block.hash],
                }),
              }),
            );
          }
        }

        this._knownBlockHashes.add(block.hash);
        this._knownHeaderHashes.add(block.hash);
        for (const transaction of block.transactions) {
          delete this.memPool[transaction.hashHex];
          this._knownTransactionHashes.add(transaction.hash);
        }
      } finally {
        this._tempKnownBlockHashes.delete(block.hashHex);
      }
    }
  }

  async _onConsensusMessageReceived(payload: ConsensusPayload): Promise<void> {
    const consensus = this._consensus;
    if (consensus != null) {
      await this.blockchain.verifyConsensusPayload(payload);
      consensus.onConsensusPayloadReceived(payload);
    }
  }

  _onFilterAddMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    filterAdd: FilterAddPayload,
  ): void {
    if (peer.data.bloomFilter != null) {
      peer.data.bloomFilter.insert(filterAdd.data);
    }
  }

  _onFilterClearMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    // eslint-disable-next-line
    peer.data.bloomFilter = null;
  }

  _onFilterLoadMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    filterLoad: FilterLoadPayload,
  ): void {
    // eslint-disable-next-line
    peer.data.bloomFilter = createPeerBloomFilter(filterLoad);
  }

  _onGetAddrMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    const addresses = _.take(
      _.shuffle(
        this._network.connectedPeers
          .map(connectedPeer => connectedPeer.data.address)
          .filter(Boolean),
      ),
      GET_ADDR_PEER_COUNT,
    );
    if (addresses.length > 0) {
      this._sendMessage(
        peer,
        this._createMessage({
          command: COMMAND.ADDR,
          payload: new AddrPayload({ addresses }),
        }),
      );
    }
  }

  async _onGetBlocksMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    getBlocks: GetBlocksPayload,
  ): Promise<void> {
    const headers = await this._getHeaders(
      getBlocks,
      this.blockchain.currentBlockIndex,
    );
    this._sendMessage(
      peer,
      this._createMessage({
        command: COMMAND.INV,
        payload: new InvPayload({
          type: INVENTORY_TYPE.BLOCK,
          hashes: headers.map(header => header.hash),
        }),
      }),
    );
  }

  async _onGetDataMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    getData: InvPayload,
  ): Promise<void> {
    switch (getData.type) {
      case 0x01: // Transaction
        await Promise.all(
          getData.hashes.map(async hash => {
            let transaction = this.memPool[common.uInt256ToHex(hash)];
            if (transaction == null) {
              transaction = await this.blockchain.transaction.tryGet({ hash });
            }

            if (transaction != null) {
              this._sendMessage(
                peer,
                this._createMessage({
                  command: COMMAND.TX,
                  payload: transaction,
                }),
              );
            }
          }),
        );
        break;
      case 0x02: // Block
        await Promise.all(
          getData.hashes.map(async hash => {
            const block = await this.blockchain.block.tryGet({
              hashOrIndex: hash,
            });
            if (block != null) {
              if (peer.data.bloomFilter == null) {
                this._sendMessage(
                  peer,
                  this._createMessage({
                    command: COMMAND.BLOCK,
                    payload: block,
                  }),
                );
              } else {
                this._sendMessage(
                  peer,
                  this._createMessage({
                    command: COMMAND.MERKLE_BLOCK,
                    payload: this._createMerkleBlockPayload({
                      block,
                      flags: block.transactions.map(transaction =>
                        this._testFilter(peer.data.bloomFilter, transaction),
                      ),
                    }),
                  }),
                );
              }
            }
          }),
        );
        break;
      case 0xe0: // Consensus
        getData.hashes.forEach(hash => {
          const payload = this._consensusCache.get(common.uInt256ToHex(hash));
          if (payload != null) {
            this._sendMessage(
              peer,
              this._createMessage({
                command: COMMAND.CONSENSUS,
                payload,
              }),
            );
          }
        });
        // TODO: Implement
        break;
      default:
        // eslint-disable-next-line
        (getData.type: empty);
        break;
    }
  }

  async _onGetHeadersMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    getBlocks: GetBlocksPayload,
  ): Promise<void> {
    const headers = await this._getHeaders(
      getBlocks,
      this.blockchain.currentHeader.index,
    );
    this._sendMessage(
      peer,
      this._createMessage({
        command: COMMAND.HEADERS,
        payload: new HeadersPayload({ headers }),
      }),
    );
  }

  async _onHeadersMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    headersPayload: HeadersPayload,
  ): Promise<void> {
    const headers = headersPayload.headers.filter(
      header =>
        !this._knownHeaderHashes.has(header.hash) &&
        !this._tempKnownHeaderHashes.has(header.hashHex),
    );
    if (headers.length > 0) {
      for (const header of headers) {
        this._tempKnownHeaderHashes.add(header.hashHex);
      }
      try {
        await this.blockchain.persistHeaders(headers);
        for (const header of headers) {
          this._knownHeaderHashes.add(header.hash);
        }
      } finally {
        for (const header of headers) {
          this._tempKnownHeaderHashes.delete(header.hashHex);
        }
      }
    }

    if (this.blockchain.currentHeader.index < peer.data.startHeight) {
      this._sendMessage(
        peer,
        this._createMessage({
          command: COMMAND.GET_HEADERS,
          payload: new GetBlocksPayload({
            hashStart: [this.blockchain.currentHeader.hash],
          }),
        }),
      );
    }
  }

  _onInvMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    inv: InvPayload,
  ): void {
    let hashes;
    switch (inv.type) {
      case 0x01: // Transaction
        hashes = inv.hashes.filter(
          hash =>
            !this._knownTransactionHashes.has(hash) &&
            !this._tempKnownTransactionHashes.has(common.uInt256ToHex(hash)),
        );
        break;
      case 0x02: // Block
        hashes = inv.hashes.filter(
          hash =>
            !this._knownBlockHashes.has(hash) &&
            !this._tempKnownBlockHashes.has(common.uInt256ToHex(hash)),
        );
        break;
      case 0xe0: // Consensus
        // eslint-disable-next-line
        hashes = inv.hashes;
        break;
      default:
        // eslint-disable-next-line
        (inv.type: empty);
        hashes = [];
        break;
    }

    if (hashes.length > 0) {
      this._sendMessage(
        peer,
        this._createMessage({
          command: COMMAND.GET_DATA,
          payload: new InvPayload({ type: inv.type, hashes }),
        }),
      );
    }
  }

  _onMemPoolMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    this._sendMessage(
      peer,
      this._createMessage({
        command: COMMAND.INV,
        payload: new InvPayload({
          type: INVENTORY_TYPE.TRANSACTION,
          hashes: commonUtils
            .values(this.memPool)
            .map(transaction => transaction.hash),
        }),
      }),
    );
  }

  async _onTransactionReceived(transaction: Transaction): Promise<void> {
    if (this._ready()) {
      await this.relayTransaction(transaction);
      // TODO: Kinda hacky
      if (
        transaction.type === TRANSACTION_TYPE.MINER &&
        this._consensus != null
      ) {
        this._consensus.onTransactionReceived(transaction);
      }
    }
  }

  _onVerackMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    peer.close();
  }

  _onVersionMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    peer.close();
  }

  async _getHeaders(
    getBlocks: GetBlocksPayload,
    maxHeight: number,
  ): Promise<Array<Header>> {
    let hashStopIndexPromise = Promise.resolve(maxHeight);
    if (getBlocks.hashStop !== 0) {
      hashStopIndexPromise = this.blockchain.header
        .tryGet({ hashOrIndex: getBlocks.hashStop })
        .then(
          hashStopHeader =>
            hashStopHeader == null
              ? maxHeight
              : Math.min(hashStopHeader.index, maxHeight),
        );
    }
    const [hashStartHeaders, hashEnd] = await Promise.all([
      Promise.all(
        getBlocks.hashStart.map(hash =>
          this.blockchain.header.tryGet({ hashOrIndex: hash }),
        ),
      ),
      hashStopIndexPromise,
    ]);
    const hashStartHeader = _.head(
      _.orderBy(hashStartHeaders.filter(Boolean), [header => header.index]),
    );
    if (hashStartHeader == null) {
      return [];
    }
    const hashStart = hashStartHeader.index + 1;
    if (hashStart > maxHeight) {
      return [];
    }

    const headers = await Promise.all(
      _.range(hashStart, Math.min(hashStart + GET_BLOCKS_COUNT, hashEnd)).map(
        index => this.blockchain.header.get({ hashOrIndex: index }),
      ),
    );

    return headers;
  }

  async _trimMemPool(): Promise<void> {
    const memPool = commonUtils.values(this.memPool);
    if (memPool.length > MEM_POOL_SIZE) {
      const transactionAndFee = await Promise.all(
        memPool.map(async transaction => {
          const networkFee = await transaction.getNetworkFee({
            getOutput: this.blockchain.output.get,
            governingToken: this.blockchain.settings.governingToken,
            utilityToken: this.blockchain.settings.utilityToken,
            fees: this.blockchain.settings.fees,
            registerValidatorFee: this.blockchain.settings.registerValidatorFee,
          });
          return [transaction, networkFee];
        }),
      );
      const hashesToRemove = _.take(
        _.sortBy(
          transactionAndFee,
          // TODO: Might be a bug since we're converting to number
          ([transaction, networkFee]) =>
            networkFee.divn(transaction.size).toNumber(),
        ),
        // eslint-disable-next-line
      ).map(([transaction, _]) => transaction.hashHex);
      for (const hash of hashesToRemove) {
        delete this.memPool[hash];
      }
    }
  }

  _testFilter(bloomFilterIn: ?BloomFilter, transaction: Transaction): boolean {
    const bloomFilter = bloomFilterIn;
    if (bloomFilter == null) {
      return true;
    }
    return (
      bloomFilter.contains(transaction.hash) ||
      transaction.outputs.some(output =>
        bloomFilter.contains(output.address),
      ) ||
      transaction.inputs.some(input =>
        bloomFilter.contains(input.serializeWire()),
      ) ||
      transaction.scripts.some(script =>
        bloomFilter.contains(crypto.toScriptHash(script.verification)),
      ) ||
      (transaction.type === TRANSACTION_TYPE.REGISTER &&
        transaction instanceof RegisterTransaction &&
        bloomFilter.contains(transaction.asset.admin))
    );
  }

  _createMerkleBlockPayload({
    block,
    flags,
  }: {|
    block: Block,
    flags: Array<boolean>,
  |}): MerkleBlockPayload {
    const tree = new MerkleTree(
      block.transactions.map(transaction => transaction.hash),
    ).trim(flags);

    const buffer = Buffer.allocUnsafe(Math.floor((flags.length + 7) / 8));
    for (let i = 0; i < flags.length; i += 1) {
      if (flags[i]) {
        // eslint-disable-next-line
        buffer[Math.floor(i / 8)] |= 1 << (i % 8);
      }
    }

    return new MerkleBlockPayload({
      version: block.version,
      previousHash: block.previousHash,
      merkleRoot: block.merkleRoot,
      timestamp: block.timestamp,
      index: block.index,
      consensusData: block.consensusData,
      nextConsensus: block.nextConsensus,
      script: block.script,
      transactionCount: block.transactions.length,
      hashes: tree.toHashArray(),
      flags: buffer,
    });
  }

  _createMessage(value: MessageValue): Message {
    return new Message({
      magic: this.blockchain.settings.messageMagic,
      value,
    });
  }
}
