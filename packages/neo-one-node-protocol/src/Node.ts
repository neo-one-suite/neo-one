import {
  AttributeTypeModel,
  common,
  InvalidFormatError,
  UInt256,
  UInt256Hex,
  utils,
  VerifyResultModel,
  VerifyResultModelExtended,
} from '@neo-one/client-common';
import { AggregationType, globalStats, MeasureUnit } from '@neo-one/client-switch';
import { createChild, nodeLogger } from '@neo-one/logger';
import { Consensus, ConsensusOptions } from '@neo-one/node-consensus';
import {
  assertFullNodeCapability,
  assertServerCapability,
  Block,
  Blockchain,
  ConnectedPeer,
  createEndpoint,
  CreateNetwork,
  Endpoint,
  ExtensiblePayload,
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
  TransactionVerificationContext,
  Version,
} from '@neo-one/node-core';
import {
  composeDisposables,
  Disposable,
  Labels,
  labelToTag,
  noopDisposable,
  utils as commonUtils,
} from '@neo-one/utils';
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
import { PeerData } from './PeerData';

const logger = createChild(nodeLogger, { component: 'node-protocol' });

const messageReceivedTag = labelToTag(Labels.COMMAND_NAME);

const messagesReceived = globalStats.createMeasureInt64('messages/received', MeasureUnit.UNIT);
const messagesFailed = globalStats.createMeasureInt64('messages/failed', MeasureUnit.UNIT);
const mempoolSize = globalStats.createMeasureInt64('mempool/size', MeasureUnit.UNIT);

const NEO_PROTOCOL_MESSAGES_RECEIVED_TOTAL = globalStats.createView(
  'neo_protocol_messages_received_total',
  messagesReceived,
  AggregationType.COUNT,
  [messageReceivedTag],
  'Number of messages received',
);
globalStats.registerView(NEO_PROTOCOL_MESSAGES_RECEIVED_TOTAL);

const NEO_PROTOCOL_MESSAGES_FAILURES_TOTAL = globalStats.createView(
  'neo_protocol_messages_failures_total',
  messagesFailed,
  AggregationType.COUNT,
  [messageReceivedTag],
  'Number of message failures',
);
globalStats.registerView(NEO_PROTOCOL_MESSAGES_FAILURES_TOTAL);

const NEO_PROTOCOL_MEMPOOL_SIZE = globalStats.createView(
  'neo_protocol_mempool_size',
  mempoolSize,
  AggregationType.LAST_VALUE,
  [],
  'Current mempool size',
);
globalStats.registerView(NEO_PROTOCOL_MEMPOOL_SIZE);

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
const GET_BLOCKS_TIME_MS = 1000;
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

export class Node implements INode {
  public readonly blockchain: Blockchain;
  public readonly native: NativeContainer;
  public readonly getNewVerificationContext: () => TransactionVerificationContext;
  // tslint:disable-next-line readonly-keyword
  private mutableMemPool: { [hash: string]: Transaction };
  // tslint:disable-next-line: readonly-keyword
  private readonly mutableSentCommands: { [k: number]: boolean } = {};
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
  private readonly consensusCache: LRUCache<string, ExtensiblePayload>;
  // tslint:disable-next-line readonly-keyword
  private mutableBlockIndex: { [endpoint: string]: number };
  private mutableConsensus: Consensus | undefined;

  private readonly requestBlocks = _.debounce(() => {
    const peer = this.mutableBestPeer;
    const previousBlock = this.blockchain.previousBlock;
    const block = previousBlock === undefined ? this.blockchain.currentBlock : previousBlock;
    if (peer === undefined) {
      return;
    }

    const peerIndex = this.mutableBlockIndex[peer.endpoint];
    if (block.index < peerIndex) {
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

        const requestAmount = Math.min(peerIndex - block.index, this.mutableGetBlocksRequestsCount * 50);
        this.mutableGetBlocksRequestTime = Date.now();
        this.sendMessage(
          peer,
          Message.create({
            command: Command.GetBlocks,
            payload: new GetBlocksPayload({
              hashStart: block.hash,
              count: requestAmount,
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
  private readonly trimMemPool = _.throttle(async (): Promise<void> => {
    const memPool = Object.values(this.mutableMemPool);
    if (memPool.length > MEM_POOL_SIZE) {
      const transactionAndFees = memPool.map((transaction) => {
        const networkFee = transaction.networkFee;

        return { transaction, networkFee };
      });

      const hashesToRemove = _.take<TransactionAndFee>(
        // tslint:disable-next-line no-array-mutation
        transactionAndFees.slice().sort(compareTransactionAndFees),
        this.blockchain.settings.memoryPoolMaxTransactions,
      ).map((transactionAndFee) => transactionAndFee.transaction.hashHex);
      hashesToRemove.forEach((hash) => {
        // tslint:disable-next-line no-dynamic-delete
        delete this.mutableMemPool[hash];
      });
      globalStats.record([
        {
          measure: mempoolSize,
          value: Object.keys(this.mutableMemPool).length,
        },
      ]);
    }
  }, TRIM_MEMPOOL_THROTTLE);

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
    this.native = native;
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
    this.userAgent = `NEO:neo-one-js:3.0.0`;

    this.mutableMemPool = {};
    this.getNewVerificationContext = () =>
      new TransactionVerificationContext({ getGasBalance: native.GAS.balanceOf.bind(native.GAS) });
    this.transactionVerificationContext = this.getNewVerificationContext();
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
    { forceAdd = false }: { readonly forceAdd?: boolean } = {
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
            foundTransaction = await this.blockchain.getTransaction(transaction.hash);
          } finally {
            logLabels = {
              [Labels.NEO_TRANSACTION_FOUND]: foundTransaction !== undefined,
              ...logLabels,
            };
          }
          let verifyResult: VerifyResultModelExtended | undefined;
          if (foundTransaction === undefined) {
            verifyResult = await this.blockchain.verifyTransaction(
              transaction,
              this.mutableMemPool,
              this.transactionVerificationContext,
            );

            if (verifyResult.verifyResult === VerifyResultModel.Succeed) {
              this.mutableMemPool[transaction.hashHex] = transaction;

              globalStats.record([
                {
                  measure: mempoolSize,
                  value: Object.keys(this.mutableMemPool).length,
                },
              ]);

              if (this.mutableConsensus !== undefined) {
                this.mutableConsensus.onTransactionReceived(transaction);
              }
              this.transactionVerificationContext.addTransaction(transaction);
              this.relayTransactionInternal(transaction);
              await this.trimMemPool();
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
        if (error.code === undefined || typeof error.code !== 'string' || !error.code.includes('VERIFY')) {
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

  public relayConsensusPayload(payload: ExtensiblePayload): void {
    const message = Message.create({
      command: Command.Inv,
      payload: new InvPayload({
        type: InventoryType.Extensible,
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
    this.mutableSentCommands[message.value.command] = true;
  }

  private readonly negotiate = async (peer: Peer<Message>): Promise<NegotiateResult<PeerData>> => {
    this.sendMessage(
      peer,
      Message.create({
        command: Command.Version,
        payload: VersionPayload.create({
          network: this.blockchain.settings.network,
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
      throw new NegotiationError(message, 'Expected Version');
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

    this.sendMessage(peer, Message.create({ command: Command.Verack }));

    const nextMessage = await peer.receiveMessage(30000);
    if (nextMessage.value.command !== Command.Verack) {
      throw new NegotiationError(nextMessage, 'Expected Verack');
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
          case Command.Extensible:
            await this.onExtensibleMessageReceived(message.value.payload);

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
          case Command.Headers:
            await this.onHeadersMessageReceived(peer, message.value.payload);

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
    if (!this.mutableSentCommands[Command.GetAddr]) {
      return;
    }
    this.mutableSentCommands[Command.GetAddr] = false;

    addr.addressList
      .filter((address) => !LOCAL_HOST_ADDRESSES.has(address.address))
      .filter((address) => address.port > 0)
      .map((address) => address.endpoint)
      .forEach((endpoint) => this.network.addEndpoint(endpoint));
  }

  private async onBlockMessageReceived(peer: ConnectedPeer<Message, PeerData>, block: Block): Promise<void> {
    this.updateLastBlockIndex(peer.endpoint, block.index);

    await this.relayBlock(block);
  }

  private async persistBlock(block: Block): Promise<void> {
    if (this.blockchain.currentBlockIndex > block.index || this.tempKnownBlockHashes.has(block.hashHex)) {
      return;
    }

    if (!this.mutableKnownBlockHashes.has(block.hash)) {
      this.tempKnownBlockHashes.add(block.hashHex);

      try {
        const foundBlock = await this.blockchain.getBlock(block.hash);

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
              ['neo.block.transactions']: block.transactions.length,
            });
          } catch (err) {
            logger.error({ name: 'neo_relay_block', [Labels.NEO_BLOCK_INDEX]: block.index, err });
            throw err;
          }
        }

        this.mutableKnownBlockHashes.add(block.hash);
        this.mutableKnownHeaderHashes.add(block.hash);
        this.blockchain.headerCache.add(block.header);
        block.transactions.forEach((transaction) => {
          // tslint:disable-next-line no-dynamic-delete
          delete this.mutableMemPool[transaction.hashHex];
          this.mutableKnownTransactionHashes.add(transaction.hash);
        });

        globalStats.record([
          {
            measure: mempoolSize,
            value: Object.keys(this.mutableMemPool).length,
          },
        ]);
      } finally {
        this.tempKnownBlockHashes.delete(block.hashHex);
      }
    }
  }

  private async onExtensibleMessageReceived(payload: ExtensiblePayload): Promise<void> {
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
    const hash = payload.hashStart;
    const count = payload.count < 0 || payload.count > GET_BLOCKS_COUNT ? GET_BLOCKS_COUNT : payload.count;
    const state = await this.blockchain.getBlock(hash);
    if (state === undefined) {
      return;
    }

    const currentHeight = await this.blockchain.getCurrentIndex();

    const tempHashes = await Promise.all(
      _.range(1, count).map(async (idx) => {
        const index = state.index + idx;
        if (index > currentHeight) {
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
    const count = payload.count === -1 ? GET_BLOCKS_COUNT : Math.min(payload.count, GET_BLOCKS_COUNT);
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
            // TODO: we might need to remove this part and only check mempool for transaction
            if (transaction === undefined) {
              const state = await this.blockchain.getTransaction(hash);
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
      case InventoryType.Extensible: // Extensible
        getData.hashes.forEach((hash) => {
          // TODO: does this belong here? Not in C# code
          const payload = this.consensusCache.get(common.uInt256ToHex(hash));
          if (payload !== undefined) {
            this.sendMessage(
              peer,
              Message.create({
                command: Command.Extensible,
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
    const currentIndex = this.blockchain.currentBlockIndex;
    if (startIndex > currentIndex) {
      return;
    }

    const tempHeaders = await Promise.all(
      _.range(count).map(async (idx) => this.blockchain.getHeader(startIndex + idx)),
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

  private async onHeadersMessageReceived(peer: ConnectedPeer<Message, PeerData>, payload: HeadersPayload) {
    const newIndex = payload.headers[payload.headers.length - 1].index;
    this.updateLastBlockIndex(peer.endpoint, newIndex);

    if (this.blockchain.headerCache.isFull) {
      return;
    }

    let headerHeight = this.blockchain.headerCache.last?.index ?? this.blockchain.currentBlockIndex;

    // tslint:disable-next-line: no-loop-statement
    for (const header of payload.headers) {
      if (header.index > headerHeight + 1) {
        break;
      }
      if (header.index < headerHeight + 1) {
        continue;
      }
      if (!(await header.verify(this.blockchain.verifyOptions))) {
        break;
      }

      this.blockchain.headerCache.add(header);
      headerHeight += 1;
    }

    return;
  }

  private onInvMessageReceived(peer: ConnectedPeer<Message, PeerData>, inv: InvPayload): void {
    let hashes;
    switch (inv.type) {
      case InventoryType.TX: // Transaction
        // TODO: need to check LedgerContract storage for each transaction hash?
        hashes = inv.hashes.filter(
          (hash) =>
            !this.mutableKnownTransactionHashes.has(hash) &&
            !this.tempKnownTransactionHashes.has(common.uInt256ToHex(hash)),
        );

        break;
      case InventoryType.Block: // Block
        // TODO: need to check LedgeContract storage for each block hash?
        hashes = inv.hashes.filter(
          (hash) =>
            !this.mutableKnownBlockHashes.has(hash) && !this.tempKnownBlockHashes.has(common.uInt256ToHex(hash)),
        );

        break;
      case InventoryType.Extensible: // Consensus
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
    this.updateLastBlockIndex(peer.endpoint, payload.lastBlockIndex);
    this.sendMessage(
      peer,
      Message.create({
        command: Command.Pong,
        payload: PingPayload.create(this.blockchain.currentBlockIndex, payload.nonce),
      }),
    );
  }

  private onPongMessageReceived(peer: ConnectedPeer<Message, PeerData>, payload: PingPayload) {
    this.updateLastBlockIndex(peer.endpoint, payload.lastBlockIndex);
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

  private updateLastBlockIndex(endpoint: string, index: number) {
    if (index > (this.mutableBlockIndex[endpoint] ?? 0)) {
      this.mutableBlockIndex[endpoint] = index;
    }
  }
}
