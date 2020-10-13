import {
  AttributeTypeModel,
  common,
  InvalidFormatError,
  UInt256,
  UInt256Hex,
  utils,
  VerifyResultModel,
} from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import { Consensus, ConsensusOptions } from '@neo-one/node-consensus';
import {
  assertFullNodeCapability,
  assertServerCapability,
  Block,
  Blockchain,
  ConnectedPeer,
  ConsensusPayload,
  createEndpoint,
  CreateNetwork,
  Endpoint,
  FullNodeCapability,
  getEndpointConfig,
  NativeContainer,
  NegotiateResult,
  Network,
  NetworkEventMessage,
  Node as INode,
  NodeCapability,
  NodeCapabilityType,
  Peer,
  RelayTransactionResult,
  ServerCapability,
  Transaction,
  Version,
} from '@neo-one/node-core';
import { composeDisposables, Disposable, Labels, noopDisposable, utils as commonUtils } from '@neo-one/utils';
import { ScalingBloem } from 'bloem';
// tslint:disable-next-line:match-default-export-name
import BloomFilter from 'bloom-filter';
import { BN } from 'bn.js';
import fetch from 'cross-fetch';
import { Address6 } from 'ip-address';
import _ from 'lodash';
import LRUCache from 'lru-cache';
import { Command } from './Command';
import { AlreadyConnectedError, NegotiationError } from './errors';
import { Message, MessageTransform } from './Message';
import {
  AddrPayload,
  FilterAddPayload,
  FilterLoadPayload,
  GetBlockByIndexPayload,
  GetBlocksPayload,
  HeadersPayload,
  InventoryType,
  InvPayload,
  MerkleBlockPayload,
  NetworkAddress,
  PingPayload,
  VersionPayload,
} from './payload';
import { maxHashesCount } from './payload/InvPayload';
import { PeerData } from './PeerData';
import { TransactionVerificationContext } from './TransactionVerificationContext';

const logger = createChild(nodeLogger, { component: 'node-protocol' });

export interface TransactionAndFee {
  readonly transaction: Transaction;
  readonly networkFee: BN;
}

const compareBool = (a: boolean, b: boolean) => {
  if (a) {
    if (b) {
      return 0;
    }

    return 1;
  }
  if (b) {
    return -1;
  }

  return 0;
};

export interface Options {
  readonly externalPort?: number;
  readonly consensus?: ConsensusOptions;
  readonly rpcURLs?: readonly string[];
  readonly unhealthyPeerSeconds?: number;
}

const createPeerBloomFilter = ({
  filter,
  k,
  tweak,
}: {
  readonly filter: Buffer;
  readonly k: number;
  readonly tweak: number;
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

const compareTransactionAndFees = (val1: TransactionAndFee, val2: TransactionAndFee) => {
  const attrComp = compareBool(
    val1.transaction.attributes.some((attr) => attr.type === AttributeTypeModel.HighPriority),
    val2.transaction.attributes.some((attr) => attr.type === AttributeTypeModel.HighPriority),
  );
  if (attrComp !== 0) {
    return attrComp;
  }

  const feePerByteComp = val1.networkFee.divn(val1.transaction.size).cmp(val2.networkFee.divn(val2.transaction.size));
  if (feePerByteComp !== 0) {
    return feePerByteComp;
  }

  const feeComp = val1.networkFee.cmp(val2.networkFee);
  if (feeComp !== 0) {
    return feeComp;
  }

  return val1.transaction.hash.compare(val2.transaction.hash);
};

const MEM_POOL_SIZE = 5000;
const GET_BLOCKS_COUNT = 500;
// Assume that we get 500 back, but if not, at least request every 10 seconds
const GET_BLOCKS_BUFFER = GET_BLOCKS_COUNT / 3;
const GET_BLOCKS_TIME_MS = 5000;
const GET_BLOCKS_THROTTLE_MS = 1000;
const TRIM_MEMPOOL_THROTTLE = 5000;
const GET_BLOCKS_CLOSE_COUNT = 2;
const UNHEALTHY_PEER_SECONDS = 300;
const LOCAL_HOST_ADDRESSES = new Set(['', '0.0.0.0', 'localhost', '127.0.0.1', '::', '::1']);

interface PeerHealth {
  readonly healthy: boolean;
  readonly blockIndex: number | undefined;
  readonly checkTimeSeconds: number;
}

const trimMemPool = () => Promise.reject(new Error('not implemented yet'));

export class Node implements INode {
  public readonly blockchain: Blockchain;
  // tslint:disable-next-line readonly-keyword
  private mutableMemPool: { [hash: string]: Transaction };
  private readonly transactionVerificationContext: TransactionVerificationContext;
  private readonly network: Network<Message, PeerData>;
  private readonly options: Options;
  private readonly externalPort: number;
  private readonly nonce: number;
  private readonly userAgent: string;
  private mutableKnownBlockHashes: ScalingBloem;
  private readonly tempKnownBlockHashes: Set<UInt256Hex>;
  private mutableKnownTransactionHashes: ScalingBloem;
  private readonly tempKnownTransactionHashes: Set<UInt256Hex>;
  private mutableKnownHeaderHashes: ScalingBloem;
  private readonly tempKnownHeaderHashes: Set<UInt256Hex>;
  private mutableGetBlocksRequestsIndex: number | undefined;
  private mutableGetBlocksRequestTime: number | undefined;
  private mutableGetBlocksRequestsCount: number;
  private mutableBestPeer: ConnectedPeer<Message, PeerData> | undefined;
  private mutableUnhealthyPeerSeconds = UNHEALTHY_PEER_SECONDS;
  private readonly consensusCache: LRUCache<string, ConsensusPayload>;
  // tslint:disable-next-line readonly-keyword
  private mutableBlockIndex: { [endpoint: string]: number };
  private mutableConsensus: Consensus | undefined;

  private readonly requestBlocks = _.debounce(() => {
    const peer = this.mutableBestPeer;
    const previousBlock = this.blockchain.previousBlock;
    const block = previousBlock === undefined ? this.blockchain.currentBlock : previousBlock;
    if (peer !== undefined && block.index < this.mutableBlockIndex[peer.endpoint]) {
      if (this.mutableGetBlocksRequestsCount > GET_BLOCKS_CLOSE_COUNT) {
        this.mutableBestPeer = this.findBestPeer(peer);
        this.network.blacklistAndClose(peer);
        this.mutableGetBlocksRequestsCount = 0;
      } else if (this.shouldRequestBlocks()) {
        if (this.mutableGetBlocksRequestsIndex === block.index) {
          this.mutableGetBlocksRequestsCount += 1;
        } else {
          this.mutableGetBlocksRequestsCount = 1;
          this.mutableGetBlocksRequestsIndex = block.index;
        }
        this.mutableGetBlocksRequestTime = Date.now();
        this.sendMessage(
          peer,
          Message.create({
            command: Command.GetBlocks,
            payload: new GetBlocksPayload({
              hashStart: block.hash,
              count: this.mutableGetBlocksRequestsCount * 100,
            }),
          }),
        );
      }

      this.requestBlocks();
    }
  }, GET_BLOCKS_THROTTLE_MS);

  private readonly onRequestEndpoints = _.throttle((): void => {
    this.relay(Message.create({ command: Command.GetAddr }));
    // tslint:disable-next-line no-floating-promises
    this.fetchEndpointsFromRPC();
  }, 5000);

  // tslint:disable-next-line no-unnecessary-type-annotation
  // private readonly trimMemPool = _.throttle(async (): Promise<void> => {
  //   const memPool = Object.values(this.mutableMemPool);
  //   if (memPool.length > MEM_POOL_SIZE) {
  //     const transactionAndFees = await Promise.all(
  //       memPool.map<Promise<TransactionAndFee>>(async (transaction) => {
  //         const networkFee = await transaction.networkFee({
  //           fees: this.blockchain.settings.fees,
  //         });

  //         return { transaction, networkFee };
  //       }),
  //     );

  //     const hashesToRemove = _.take<TransactionAndFee>(
  //       // tslint:disable-next-line no-array-mutation
  //       transactionAndFees.slice().sort(compareTransactionAndFees),
  //       this.blockchain.settings.memoryPoolMaxTransactions,
  //     ).map((transactionAndFee) => transactionAndFee.transaction.hashHex);
  //     hashesToRemove.forEach((hash) => {
  //       // tslint:disable-next-line no-dynamic-delete
  //       delete this.mutableMemPool[hash];
  //     });
  //   }
  // }, TRIM_MEMPOOL_THROTTLE);

  public constructor({
    blockchain,
    native,
    createNetwork,
    options,
  }: {
    readonly blockchain: Blockchain;
    readonly native: NativeContainer;
    readonly createNetwork: CreateNetwork;
    readonly options: Options;
  }) {
    this.blockchain = blockchain;
    this.network = createNetwork({
      negotiate: this.negotiate,
      checkPeerHealth: this.checkPeerHealth,
      createMessageTransform: () => new MessageTransform(this.blockchain.deserializeWireContext),
      onMessageReceived: (peer, message: Message) => {
        this.onMessageReceived(peer, message);
      },
      onRequestEndpoints: this.onRequestEndpoints.bind(this),
      onEvent: this.onEvent,
    });

    this.options = options;

    const { externalPort = 0 } = options;
    this.externalPort = externalPort;
    this.nonce = Math.floor(Math.random() * utils.UINT_MAX_NUMBER);
    this.userAgent = `NEO:neo-one-js:3.0.0-preview`;

    this.mutableMemPool = {};
    this.transactionVerificationContext = new TransactionVerificationContext({
      getGasBalance: native.GAS.balanceOf,
    });
    this.mutableKnownBlockHashes = createScalingBloomFilter();
    this.tempKnownBlockHashes = new Set();
    this.mutableKnownTransactionHashes = createScalingBloomFilter();
    this.tempKnownTransactionHashes = new Set();
    this.mutableKnownHeaderHashes = createScalingBloomFilter();
    this.tempKnownHeaderHashes = new Set();
    this.mutableGetBlocksRequestsCount = 1;
    this.consensusCache = new LRUCache(10000);
    this.mutableBlockIndex = {};
  }

  public get version(): Version {
    return {
      tcpPort: this.externalPort,
      wsPort: -1,
      nonce: this.nonce,
      useragent: this.userAgent,
    };
  }

  public get capabilities(): readonly NodeCapability[] {
    const fullNodeCapability = new FullNodeCapability({ startHeight: this.blockchain.currentBlockIndex });
    const tcpCapability = new ServerCapability({ type: NodeCapabilityType.TcpServer, port: this.externalPort });

    return [fullNodeCapability, tcpCapability];
  }

  public get consensus(): Consensus | undefined {
    return this.mutableConsensus;
  }

  public get connectedPeers(): readonly Endpoint[] {
    return this.network.connectedPeers.map((peer) => peer.endpoint);
  }

  public get memPool(): { readonly [hash: string]: Transaction } {
    return this.mutableMemPool;
  }

  public async reset(): Promise<void> {
    this.mutableMemPool = {};
    this.mutableKnownBlockHashes = createScalingBloomFilter();
    this.tempKnownBlockHashes.clear();
    this.mutableKnownTransactionHashes = createScalingBloomFilter();
    this.tempKnownTransactionHashes.clear();
    this.mutableKnownHeaderHashes = createScalingBloomFilter();
    this.tempKnownHeaderHashes.clear();
    this.mutableGetBlocksRequestsCount = 1;
    this.consensusCache.reset();
    this.mutableBlockIndex = {};
  }

  public async start(): Promise<Disposable> {
    let disposable = noopDisposable;

    try {
      this.network.start();
      logger.debug({ name: 'neo_protocol_start' }, 'Protocol started.');

      disposable = composeDisposables(disposable, () => {
        this.network.stop();
        logger.debug({ name: 'neo_protocol_stop' }, 'Protocol stopped.');
      });

      if (this.options.consensus !== undefined) {
        const mutableConsensus = new Consensus({
          options: this.options.consensus,
          node: this,
        });
        this.mutableConsensus = mutableConsensus;

        const consensusDisposable = await mutableConsensus.start();
        disposable = composeDisposables(disposable, consensusDisposable);
      }

      this.mutableUnhealthyPeerSeconds =
        this.options.unhealthyPeerSeconds === undefined ? UNHEALTHY_PEER_SECONDS : this.options.unhealthyPeerSeconds;

      return disposable;
    } catch (err) {
      await disposable();
      throw err;
    }
  }

  public async relayTransaction(
    transaction: Transaction,
    {
      throwVerifyError = false,
      forceAdd = false,
    }: { readonly throwVerifyError?: boolean; readonly forceAdd?: boolean } = {
      throwVerifyError: false,
      forceAdd: false,
    },
  ): Promise<RelayTransactionResult> {
    if (this.tempKnownTransactionHashes.has(transaction.hashHex)) {
      return {};
    }

    if (!this.mutableKnownTransactionHashes.has(transaction.hash)) {
      this.tempKnownTransactionHashes.add(transaction.hashHex);

      try {
        const memPool = Object.values(this.mutableMemPool);
        if (memPool.length > MEM_POOL_SIZE / 2 && !forceAdd) {
          this.mutableKnownTransactionHashes.add(transaction.hash);

          return {};
        }

        let logLabels: {} = { [Labels.NEO_TRANSACTION_HASH]: transaction.hashHex };
        let finalResult: RelayTransactionResult;
        try {
          let foundTransaction;
          try {
            foundTransaction = await this.blockchain.transactions.tryGet(transaction.hash);
          } finally {
            logLabels = {
              [Labels.NEO_TRANSACTION_FOUND]: foundTransaction !== undefined,
              ...logLabels,
            };
          }
          let verifyResult: VerifyResultModel | undefined;
          if (foundTransaction === undefined) {
            verifyResult = await this.blockchain.verifyTransaction(
              transaction,
              this.mutableMemPool,
              this.transactionVerificationContext,
            );

            if (verifyResult === VerifyResultModel.Succeed) {
              this.mutableMemPool[transaction.hashHex] = transaction;
              if (this.mutableConsensus !== undefined) {
                this.mutableConsensus.onTransactionReceived(transaction);
              }
              this.transactionVerificationContext.addTransaction(transaction);
              this.relayTransactionInternal(transaction);
              await trimMemPool();
            }
          }

          this.mutableKnownTransactionHashes.add(transaction.hash);

          finalResult = { verifyResult };
          logger.debug({ name: 'neo_relay_transaction', ...logLabels });
        } catch (err) {
          logger.error({ name: 'neo_relay_transaction', err, ...logLabels });
          throw err;
        }

        return finalResult;
      } catch (error) {
        if (
          error.code === undefined ||
          typeof error.code !== 'string' ||
          !error.code.includes('VERIFY') ||
          throwVerifyError
        ) {
          throw error;
        }
      } finally {
        this.tempKnownTransactionHashes.delete(transaction.hashHex);
      }
    }

    return {};
  }

  public async relayBlock(block: Block): Promise<void> {
    await this.persistBlock(block);
  }

  public relayConsensusPayload(payload: ConsensusPayload): void {
    const message = Message.create({
      command: Command.Inv,
      payload: new InvPayload({
        type: InventoryType.Consensus,
        hashes: [payload.hash],
      }),
    });

    this.consensusCache.set(payload.hashHex, payload);
    this.relay(message);
  }

  public syncMemPool(): void {
    this.relay(Message.create({ command: Command.Mempool }));
  }

  private relay(message: Message): void {
    this.network.relay(message.serializeWire());
  }

  private relayTransactionInternal(transaction: Transaction): void {
    const message = Message.create({
      command: Command.Inv,
      payload: new InvPayload({
        type: InventoryType.TX,
        hashes: [transaction.hash],
      }),
    });

    const messagePayload = message.serializeWire();
    this.network.connectedPeers.forEach((peer) => {
      if (peer.relay && this.testFilter(peer.data.mutableBloomFilter, transaction)) {
        peer.write(messagePayload);
      }
    });
  }

  private sendMessage(peer: Peer<Message> | ConnectedPeer<Message, PeerData>, message: Message): void {
    peer.write(message.serializeWire());
  }
  private readonly negotiate = async (peer: Peer<Message>): Promise<NegotiateResult<PeerData>> => {
    this.sendMessage(
      peer,
      Message.create({
        command: Command.Version,
        payload: VersionPayload.create({
          magic: this.blockchain.settings.messageMagic,
          version: 0,
          nonce: this.nonce,
          userAgent: this.userAgent,
          capabilities: this.capabilities,
        }),
      }),
    );

    const message = await peer.receiveMessage(30000);
    const value = message.value;
    if (value.command !== Command.Version) {
      throw new NegotiationError(message);
    }

    const versionPayload = value.payload;

    this.checkVersion(peer, message, versionPayload);

    const { host } = getEndpointConfig(peer.endpoint);

    const address = NetworkAddress.isValid(host)
      ? new NetworkAddress({
          timestamp: versionPayload.timestamp,
          address: host,
          capabilities: versionPayload.capabilities,
        })
      : undefined;

    const verackMessage = Message.create({ command: Command.Verack });
    this.sendMessage(peer, verackMessage);
    const nextMessage = await peer.receiveMessage(30000);
    if (nextMessage.value.command !== Command.Verack) {
      throw new NegotiationError(nextMessage);
    }

    const { relay, port, startHeight } = versionPayload.capabilities.reduce(
      (acc, capability) => {
        switch (capability.type) {
          case NodeCapabilityType.FullNode:
            const fullCap = assertFullNodeCapability(capability);

            return {
              ...acc,
              relay: true,
              startHeight: fullCap.startHeight,
            };

          case NodeCapabilityType.TcpServer:
            const tcpCap = assertServerCapability(capability);

            return {
              ...acc,
              port: tcpCap.port,
            };

          case NodeCapabilityType.WsServer:
            return acc;

          default:
            throw new InvalidFormatError();
        }
      },
      { relay: false, port: 0, startHeight: 0 },
    );
    this.mutableBlockIndex[peer.endpoint] = startHeight;

    return {
      data: {
        nonce: versionPayload.nonce,
        mutableBloomFilter: undefined,
        address,
        listenPort: port,
      },

      relay,
    };
  };
  private readonly checkPeerHealth = (peer: ConnectedPeer<Message, PeerData>, prevHealth?: PeerHealth) => {
    const checkTimeSeconds = commonUtils.nowSeconds();
    const blockIndex = this.mutableBlockIndex[peer.endpoint] as number | undefined;

    // If first check -> healthy
    if (prevHealth === undefined) {
      return { healthy: true, checkTimeSeconds, blockIndex };
    }

    // If seen new block -> healthy + update check time
    if (prevHealth.blockIndex !== undefined && blockIndex !== undefined && prevHealth.blockIndex < blockIndex) {
      return { healthy: true, checkTimeSeconds, blockIndex };
    }

    // If not seen a block or a new block BUT it has NOT been a long
    // time -> healthy
    if (
      prevHealth.blockIndex === blockIndex &&
      commonUtils.nowSeconds() - prevHealth.checkTimeSeconds < this.mutableUnhealthyPeerSeconds
    ) {
      return {
        healthy: true,
        checkTimeSeconds: prevHealth.checkTimeSeconds,
        blockIndex: prevHealth.blockIndex,
      };
    }

    return { healthy: false, checkTimeSeconds, blockIndex };
  };

  private readonly onEvent = (event: NetworkEventMessage<Message, PeerData>) => {
    if (event.event === 'PEER_CONNECT_SUCCESS') {
      const { connectedPeer } = event;
      if (
        this.mutableBestPeer === undefined ||
        // Only change best peer at most every 100 blocks
        this.mutableBlockIndex[this.mutableBestPeer.endpoint] + 100 < this.mutableBlockIndex[connectedPeer.endpoint]
      ) {
        this.mutableBestPeer = connectedPeer;
        this.resetRequestBlocks();
        this.requestBlocks();
      }
    } else if (
      event.event === 'PEER_CLOSED' &&
      this.mutableBestPeer !== undefined &&
      this.mutableBestPeer.endpoint === event.peer.endpoint
    ) {
      this.mutableBestPeer = this.findBestPeer();
      this.resetRequestBlocks();
      this.requestBlocks();
    }
  };

  private findBestPeer(bestPeer?: ConnectedPeer<Message, PeerData>): ConnectedPeer<Message, PeerData> | undefined {
    let peers = this.network.connectedPeers;
    if (bestPeer !== undefined) {
      peers = peers.filter((peer) => peer.endpoint !== bestPeer.endpoint);
    }
    const result = _.maxBy(peers, (peer) => this.mutableBlockIndex[peer.endpoint]);
    if (result === undefined) {
      return undefined;
    }

    return _.shuffle(
      peers.filter((peer) => this.mutableBlockIndex[peer.endpoint] === this.mutableBlockIndex[result.endpoint]),
    )[0];
  }

  private resetRequestBlocks(): void {
    this.mutableGetBlocksRequestsIndex = undefined;
    this.mutableGetBlocksRequestsCount = 0;
  }

  private shouldRequestBlocks(): boolean {
    const block = this.blockchain.currentBlock;
    const getBlocksRequestTime = this.mutableGetBlocksRequestTime;

    return (
      this.mutableGetBlocksRequestsIndex === undefined ||
      block.index - this.mutableGetBlocksRequestsIndex > GET_BLOCKS_BUFFER ||
      getBlocksRequestTime === undefined ||
      Date.now() - getBlocksRequestTime > GET_BLOCKS_TIME_MS
    );
  }

  private checkVersion(peer: Peer<Message>, message: Message, version: VersionPayload): void {
    if (version.nonce === this.nonce) {
      this.network.permanentlyBlacklist(peer.endpoint);
      throw new NegotiationError(message, 'Nonce equals my nonce.');
    }

    const connectedPeer = this.network.connectedPeers.find((otherPeer) => version.nonce === otherPeer.data.nonce);

    if (connectedPeer !== undefined) {
      throw new AlreadyConnectedError('Already connected to nonce.');
    }
  }

  private ready(): boolean {
    const peer = this.mutableBestPeer;
    const block = this.blockchain.currentBlock;

    return peer !== undefined && block.index >= this.mutableBlockIndex[peer.endpoint];
  }

  private async fetchEndpointsFromRPC(): Promise<void> {
    try {
      await this.doFetchEndpointsFromRPC();
    } catch {
      // ignore, logged deeper in the stack
    }
  }

  private async doFetchEndpointsFromRPC(): Promise<void> {
    const { rpcURLs = [] } = this.options;
    await Promise.all(rpcURLs.map(async (rpcURL) => this.fetchEndpointsFromRPCURL(rpcURL)));
  }

  private async fetchEndpointsFromRPCURL(rpcURL: string): Promise<void> {
    try {
      const response = await fetch(rpcURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getpeers',
          params: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch peers from ${rpcURL}: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (
        typeof result === 'object' &&
        result.error !== undefined &&
        typeof result.error === 'object' &&
        typeof result.error.code === 'number' &&
        typeof result.error.message === 'string'
      ) {
        throw new Error(result.error);
      }

      const connected: ReadonlyArray<{ readonly address: string; readonly port: number }> = result.result.connected;
      connected
        .map((peer) => {
          const { address, port } = peer;

          let canonicalForm = new Address6(address).canonicalForm() as string | undefined | null;

          if (canonicalForm == undefined) {
            canonicalForm = Address6.fromAddress4(address).canonicalForm() as string | undefined | null;
          }

          return { host: canonicalForm == undefined ? '' : canonicalForm, port };
        })
        .filter((endpoint) => !LOCAL_HOST_ADDRESSES.has(endpoint.host))
        .map((endpoint) =>
          createEndpoint({
            type: 'tcp',
            host: endpoint.host,
            port: endpoint.port,
          }),
        )
        .forEach((endpoint) => this.network.addEndpoint(endpoint));
    } catch (err) {
      logger.error(
        { name: 'neo_protocol_fetch_endpoints_error', [Labels.HTTP_URL]: rpcURL, err },
        `Failed to fetch endpoints from ${rpcURL}`,
      );
    }
  }

  private onMessageReceived(peer: ConnectedPeer<Message, PeerData>, message: Message): void {
    try {
      new Promise<void>(async (resolve) => {
        switch (message.value.command) {
          case Command.Addr:
            this.onAddrMessageReceived(message.value.payload);
            break;
          case Command.Block:
            await this.onBlockMessageReceived(peer, message.value.payload);

            break;
          case Command.Consensus:
            await this.onConsensusMessageReceived(message.value.payload);

            break;
          case Command.FilterAdd:
            this.onFilterAddMessageReceived(peer, message.value.payload);

            break;
          case Command.FilterClear:
            this.onFilterClearMessageReceived(peer);
            break;
          case Command.FilterLoad:
            this.onFilterLoadMessageReceived(peer, message.value.payload);

            break;
          case Command.GetAddr:
            this.onGetAddrMessageReceived(peer);
            break;
          case Command.GetBlocks:
            await this.onGetBlocksMessageReceived(peer, message.value.payload);

            break;
          case Command.GetBlockByIndex:
            await this.onGetBlockByIndexMessageReceived(peer, message.value.payload);

            break;
          case Command.GetData:
            await this.onGetDataMessageReceived(peer, message.value.payload);

            break;
          case Command.GetHeaders:
            await this.onGetHeadersMessageReceived(peer, message.value.payload);

            break;
          case Command.Inv:
            this.onInvMessageReceived(peer, message.value.payload);

            break;
          case Command.Mempool:
            this.onMemPoolMessageReceived(peer);

            break;
          case Command.Ping:
            this.onPingMessageReceived(peer, message.value.payload);

            break;
          case Command.Pong:
            this.onPongMessageReceived(peer, message.value.payload);

            break;
          case Command.Transaction:
            await this.onTransactionReceived(message.value.payload);

            break;
          case Command.Verack:
          case Command.Version:
            throw new InvalidFormatError();
          case Command.Alert:
          case Command.Headers:
          case Command.MerkleBlock:
          case Command.NotFound:
          case Command.Reject:
          default:
        }
        resolve();
      }).catch(() => {
        // do nothing
      });
    } catch {
      // do nothing
    }
  }

  private onAddrMessageReceived(addr: AddrPayload): void {
    addr.addressList
      .filter((address) => !LOCAL_HOST_ADDRESSES.has(address.address))
      .filter((address) => address.port > 0)
      .map((address) => address.endpoint)
      .forEach((endpoint) => this.network.addEndpoint(endpoint));
  }

  private async onBlockMessageReceived(peer: ConnectedPeer<Message, PeerData>, block: Block): Promise<void> {
    const blockIndex = this.mutableBlockIndex[peer.endpoint] as number | undefined;
    this.mutableBlockIndex[peer.endpoint] = Math.max(block.index, blockIndex ?? 0);

    await this.relayBlock(block);
  }

  private async persistBlock(block: Block): Promise<void> {
    const startTime = Date.now();
    if (this.blockchain.currentBlockIndex > block.index || this.tempKnownBlockHashes.has(block.hashHex)) {
      return;
    }

    if (!this.mutableKnownBlockHashes.has(block.hash)) {
      this.tempKnownBlockHashes.add(block.hashHex);

      try {
        const foundBlock = await this.blockchain.blocks.tryGet({
          hashOrIndex: block.hash,
        });

        if (foundBlock === undefined) {
          try {
            await this.blockchain.persistBlock({ block });
            if (this.mutableConsensus !== undefined) {
              this.mutableConsensus.onPersistBlock();
            }

            const peer = this.mutableBestPeer;
            if (peer !== undefined && block.index > this.mutableBlockIndex[peer.endpoint]) {
              this.relay(
                Message.create({
                  command: Command.Inv,
                  payload: new InvPayload({
                    type: InventoryType.Block,
                    hashes: [block.hash],
                  }),
                }),
              );
            }
            logger.info({
              name: 'neo_relay_block',
              [Labels.NEO_BLOCK_INDEX]: block.index,
              timeToPersist: `${(Date.now() - startTime) / 1000} seconds`,
            });
          } catch (err) {
            logger.error({ name: 'neo_relay_block', [Labels.NEO_BLOCK_INDEX]: block.index, err });
            throw err;
          }
        }

        this.mutableKnownBlockHashes.add(block.hash);
        this.mutableKnownHeaderHashes.add(block.hash);
        block.transactions.forEach((transaction) => {
          // tslint:disable-next-line no-dynamic-delete
          delete this.mutableMemPool[transaction.hashHex];
          this.mutableKnownTransactionHashes.add(transaction.hash);
        });
      } finally {
        this.tempKnownBlockHashes.delete(block.hashHex);
      }
    }
  }

  private async onConsensusMessageReceived(payload: ConsensusPayload): Promise<void> {
    const { consensus } = this;
    if (consensus !== undefined) {
      await this.blockchain.verifyConsensusPayload(payload);
      consensus.onConsensusPayloadReceived(payload);
    }
  }

  private onFilterAddMessageReceived(peer: ConnectedPeer<Message, PeerData>, filterAdd: FilterAddPayload): void {
    if (peer.data.mutableBloomFilter !== undefined) {
      peer.data.mutableBloomFilter.insert(filterAdd.data);
    }
  }

  private onFilterClearMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    // tslint:disable-next-line no-object-mutation
    peer.data.mutableBloomFilter = undefined;
  }

  private onFilterLoadMessageReceived(peer: ConnectedPeer<Message, PeerData>, filterLoad: FilterLoadPayload): void {
    // tslint:disable-next-line no-object-mutation
    peer.data.mutableBloomFilter = createPeerBloomFilter(filterLoad);
  }

  private onGetAddrMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    const addressList = _.take(
      _.shuffle(
        this.network.connectedPeers
          .filter((connectedPeer) => connectedPeer.data.listenPort > 0)
          .map((connectedPeer) => connectedPeer.data.address)
          .filter(commonUtils.notNull),
      ),
      AddrPayload.maxCountToSend,
    );

    if (addressList.length > 0) {
      this.sendMessage(
        peer,
        Message.create({
          command: Command.Addr,
          payload: new AddrPayload({ addressList }),
        }),
      );
    }
  }

  private async onGetBlocksMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    payload: GetBlocksPayload,
  ): Promise<void> {
    const hashStart = payload.hashStart;
    const count = payload.count < 0 || payload.count > maxHashesCount ? maxHashesCount : payload.count;

    const state = await this.blockchain.blocks.tryGet({ hashOrIndex: hashStart });
    if (state === undefined) {
      return;
    }

    const currentHeaderIndex = this.blockchain.currentHeaderIndex;

    const tempHashes = await Promise.all(
      _.range(1, count).map(async (idx) => {
        const index = state.index + idx;
        if (index > currentHeaderIndex) {
          return undefined;
        }

        return this.blockchain.getBlockHash(index);
      }),
    );

    const hashes = tempHashes.filter(commonUtils.notNull);

    this.sendMessage(
      peer,
      Message.create({
        command: Command.Inv,
        payload: new InvPayload({
          type: InventoryType.Block,
          hashes,
        }),
      }),
    );
  }

  private async onGetBlockByIndexMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    payload: GetBlockByIndexPayload,
  ): Promise<void> {
    const count = payload.count === -1 ? maxHashesCount : Math.min(payload.count, maxHashesCount);
    const max = payload.indexStart + count;
    // tslint:disable-next-line: no-loop-statement
    for (let idx = payload.indexStart; idx < max; idx += 1) {
      const block = await this.blockchain.getBlock(idx);
      if (block === undefined) {
        break;
      }

      if (peer.data.mutableBloomFilter === undefined) {
        this.sendMessage(
          peer,
          Message.create({
            command: Command.Block,
            payload: block,
          }),
        );
      } else {
        this.sendMessage(
          peer,
          Message.create({
            command: Command.MerkleBlock,
            payload: MerkleBlockPayload.create({
              block,
              flags: block.transactions.map((transaction) =>
                this.testFilter(peer.data.mutableBloomFilter, transaction),
              ),
            }),
          }),
        );
      }
    }
  }

  private async onGetDataMessageReceived(peer: ConnectedPeer<Message, PeerData>, getData: InvPayload): Promise<void> {
    let notFound: readonly UInt256[] = [];
    switch (getData.type) {
      case InventoryType.TX:
        await Promise.all(
          getData.hashes.map(async (hash) => {
            let transaction = this.mutableMemPool[common.uInt256ToHex(hash)] as Transaction | undefined;
            if (transaction === undefined) {
              const state = await this.blockchain.transactions.tryGet(hash);
              transaction = state?.transaction;
            }

            if (transaction !== undefined) {
              this.sendMessage(
                peer,
                Message.create({
                  command: Command.Transaction,
                  payload: transaction,
                }),
              );
            } else {
              notFound = notFound.concat(hash);
            }
          }),
        );

        break;
      case InventoryType.Block: // Block
        await Promise.all(
          getData.hashes.map(async (hash) => {
            const block = await this.blockchain.getBlock(hash);

            if (block !== undefined) {
              if (peer.data.mutableBloomFilter === undefined) {
                this.sendMessage(
                  peer,
                  Message.create({
                    command: Command.Block,
                    payload: block,
                  }),
                );
              } else {
                this.sendMessage(
                  peer,
                  Message.create({
                    command: Command.MerkleBlock,
                    payload: MerkleBlockPayload.create({
                      block,
                      flags: block.transactions.map((transaction) =>
                        this.testFilter(peer.data.mutableBloomFilter, transaction),
                      ),
                    }),
                  }),
                );
              }
            } else {
              notFound = notFound.concat(hash);
            }
          }),
        );

        break;
      case InventoryType.Consensus: // Consensus
        getData.hashes.forEach((hash) => {
          const payload = this.consensusCache.get(common.uInt256ToHex(hash));
          if (payload !== undefined) {
            this.sendMessage(
              peer,
              Message.create({
                command: Command.Consensus,
                payload,
              }),
            );
          }
        });
        break;

      default:
        commonUtils.assertNever(getData.type);
    }

    if (notFound.length > 0) {
      InvPayload.createGroup(getData.type, notFound).forEach((payload) => {
        this.sendMessage(
          peer,
          Message.create({
            command: Command.NotFound,
            payload,
          }),
        );
      });
    }
  }

  private async onGetHeadersMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    payload: GetBlockByIndexPayload,
  ): Promise<void> {
    const startIndex = payload.indexStart;
    const count = payload.count === -1 ? HeadersPayload.maxHeadersCount : payload.count;
    if (startIndex > this.blockchain.currentHeaderIndex) {
      return;
    }

    const currentHeaderIndex = this.blockchain.currentHeaderIndex;

    const tempHeaders = await Promise.all(
      _.range(count).map(async (idx) => {
        if (startIndex + idx > currentHeaderIndex) {
          return undefined;
        }

        return this.blockchain.getHeader(startIndex + idx);
      }),
    );

    const headers = tempHeaders.filter(commonUtils.notNull);

    if (headers.length === 0) {
      return;
    }

    this.sendMessage(
      peer,
      Message.create({
        command: Command.Headers,
        payload: new HeadersPayload({ headers }),
      }),
    );
  }

  private onInvMessageReceived(peer: ConnectedPeer<Message, PeerData>, inv: InvPayload): void {
    let hashes;
    switch (inv.type) {
      case InventoryType.TX: // Transaction
        hashes = inv.hashes.filter(
          (hash) =>
            !this.mutableKnownTransactionHashes.has(hash) &&
            !this.tempKnownTransactionHashes.has(common.uInt256ToHex(hash)),
        );

        break;
      case InventoryType.Block: // Block
        hashes = inv.hashes.filter(
          (hash) =>
            !this.mutableKnownBlockHashes.has(hash) && !this.tempKnownBlockHashes.has(common.uInt256ToHex(hash)),
        );

        break;
      case InventoryType.Consensus: // Consensus
        hashes = inv.hashes;
        break;
      default:
        commonUtils.assertNever(inv.type);
        hashes = [];
    }

    if (hashes.length > 0) {
      this.sendMessage(
        peer,
        Message.create({
          command: Command.GetData,
          payload: new InvPayload({ type: inv.type, hashes }),
        }),
      );
    }
  }

  private onMemPoolMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    InvPayload.createGroup(
      InventoryType.TX,
      Object.values(this.mutableMemPool).map((tx) => tx.hash),
    ).forEach((payload) => {
      this.sendMessage(
        peer,
        Message.create({
          command: Command.Inv,
          payload,
        }),
      );
    });
  }

  private async onTransactionReceived(transaction: Transaction): Promise<void> {
    if (this.ready()) {
      await this.relayTransaction(transaction);
    }
  }

  private onPingMessageReceived(peer: ConnectedPeer<Message, PeerData>, payload: PingPayload): void {
    this.updateLastBlockIndex(peer.endpoint, payload);
    this.sendMessage(
      peer,
      Message.create({
        command: Command.Pong,
        payload: PingPayload.create(this.blockchain.currentBlockIndex, payload.nonce),
      }),
    );
  }

  private onPongMessageReceived(peer: ConnectedPeer<Message, PeerData>, payload: PingPayload) {
    this.updateLastBlockIndex(peer.endpoint, payload);
  }

  private testFilter(bloomFilterIn: BloomFilter | undefined, transaction: Transaction): boolean {
    const bloomFilter = bloomFilterIn;
    if (bloomFilter === undefined) {
      return true;
    }

    return (
      bloomFilter.contains(transaction.hash) ||
      transaction.witnesses.some((witness) => bloomFilter.contains(witness.scriptHash))
    );
  }

  private updateLastBlockIndex(endpoint: string, payload: PingPayload) {
    if (payload.lastBlockIndex > (this.mutableBlockIndex[endpoint] ?? 0)) {
      this.mutableBlockIndex[endpoint] = payload.lastBlockIndex;
    }
  }
}
