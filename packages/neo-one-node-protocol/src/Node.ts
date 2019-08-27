import { common, crypto, UInt256Hex, utils } from '@neo-one/client-common';
import { AggregationType, globalStats, MeasureUnit } from '@neo-one/client-switch';
import { createChild, nodeLogger } from '@neo-one/logger';
import { Consensus, ConsensusOptions } from '@neo-one/node-consensus';
import {
  Block,
  Blockchain,
  ConnectedPeer,
  ConsensusPayload,
  createEndpoint,
  CreateNetwork,
  Endpoint,
  getEndpointConfig,
  Header,
  MerkleTree,
  NegotiateResult,
  Network,
  NetworkEventMessage,
  Node as INode,
  Peer,
  RegisterTransaction,
  RelayTransactionResult,
  Transaction,
  TransactionType,
  VerifyTransactionResult,
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
import { Message, MessageTransform, MessageValue } from './Message';
import {
  AddrPayload,
  FilterAddPayload,
  FilterLoadPayload,
  GetBlocksPayload,
  HeadersPayload,
  InventoryType,
  InvPayload,
  MerkleBlockPayload,
  NetworkAddress,
  SERVICES,
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
  'number of messages received',
);
globalStats.registerView(NEO_PROTOCOL_MESSAGES_RECEIVED_TOTAL);

const NEO_PROTOCOL_MESSAGES_FAILURES_TOTAL = globalStats.createView(
  'neo_protocol_messages_failures_total',
  messagesFailed,
  AggregationType.COUNT,
  [messageReceivedTag],
  'number of message failures',
);
globalStats.registerView(NEO_PROTOCOL_MESSAGES_FAILURES_TOTAL);

const NEO_PROTOCOL_MEMPOOL_SIZE = globalStats.createView(
  'neo_protocol_mempool_size',
  mempoolSize,
  AggregationType.LAST_VALUE,
  [],
  'current mempool size',
);
globalStats.registerView(NEO_PROTOCOL_MEMPOOL_SIZE);

export interface TransactionAndFee {
  readonly transaction: Transaction;
  readonly networkFee: BN;
}

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
  const a = val1.networkFee.divn(val1.transaction.size);
  const b = val2.networkFee.divn(val2.transaction.size);
  if (a.lt(b)) {
    return -1;
  }
  if (b.lt(a)) {
    return 1;
  }

  return val1.transaction.hash.compare(val2.transaction.hash);
};

const MEM_POOL_SIZE = 5000;
const GET_ADDR_PEER_COUNT = 200;
const GET_BLOCKS_COUNT = 500;
// Assume that we get 500 back, but if not, at least request every 10 seconds
const GET_BLOCKS_BUFFER = GET_BLOCKS_COUNT / 3;
const GET_BLOCKS_TIME_MS = 10000;
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
  public get consensus(): Consensus | undefined {
    return this.mutableConsensus;
  }

  public get connectedPeers(): readonly Endpoint[] {
    return this.network.connectedPeers.map((peer) => peer.endpoint);
  }

  public get memPool(): { readonly [hash: string]: Transaction } {
    return this.mutableMemPool;
  }
  public readonly blockchain: Blockchain;
  // tslint:disable-next-line readonly-keyword
  private mutableMemPool: { [hash: string]: Transaction };
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
    if (peer !== undefined && block.index < peer.data.startHeight) {
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
          this.createMessage({
            command: Command.getblocks,
            payload: new GetBlocksPayload({
              hashStart: [block.hash],
            }),
          }),
        );
      }

      this.requestBlocks();
    }
  }, GET_BLOCKS_THROTTLE_MS);
  private readonly onRequestEndpoints = _.throttle((): void => {
    this.relay(this.createMessage({ command: Command.getaddr }));
    // tslint:disable-next-line no-floating-promises
    this.fetchEndpointsFromRPC();
  }, 5000);

  // tslint:disable-next-line no-unnecessary-type-annotation
  private readonly trimMemPool = _.throttle(async (): Promise<void> => {
    const memPool = Object.values(this.mutableMemPool);
    if (memPool.length > MEM_POOL_SIZE) {
      const transactionAndFees = await Promise.all(
        memPool.map<Promise<TransactionAndFee>>(async (transaction) => {
          const networkFee = await transaction.getNetworkFee({
            getOutput: this.blockchain.output.get,
            governingToken: this.blockchain.settings.governingToken,
            utilityToken: this.blockchain.settings.utilityToken,
            fees: this.blockchain.settings.fees,
            registerValidatorFee: this.blockchain.settings.registerValidatorFee,
          });

          return { transaction, networkFee };
        }),
      );

      const hashesToRemove = _.take<TransactionAndFee>(
        // tslint:disable-next-line no-array-mutation
        transactionAndFees.slice().sort(compareTransactionAndFees),
        this.blockchain.settings.memPoolSize,
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
    createNetwork,
    options,
  }: {
    readonly blockchain: Blockchain;
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
    this.userAgent = `NEO:neo-one-js:1.0.0-preview`;

    this.mutableMemPool = {};
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
    const result = {};

    if (
      transaction.type === TransactionType.Miner ||
      (this.mutableMemPool[transaction.hashHex] as Transaction | undefined) !== undefined ||
      this.tempKnownTransactionHashes.has(transaction.hashHex)
    ) {
      return result;
    }

    if (!this.mutableKnownTransactionHashes.has(transaction.hash)) {
      this.tempKnownTransactionHashes.add(transaction.hashHex);

      try {
        const memPool = Object.values(this.mutableMemPool);
        if (memPool.length > MEM_POOL_SIZE / 2 && !forceAdd) {
          this.mutableKnownTransactionHashes.add(transaction.hash);

          return result;
        }
        // tslint:disable-next-line prefer-immediate-return
        let logLabels: {} = { [Labels.NEO_TRANSACTION_HASH]: transaction.hashHex };
        let finalResult: RelayTransactionResult;
        try {
          let foundTransaction;
          try {
            foundTransaction = await this.blockchain.transaction.tryGet({
              hash: transaction.hash,
            });
          } finally {
            logLabels = {
              [Labels.NEO_TRANSACTION_FOUND]: foundTransaction !== undefined,
              ...logLabels,
            };
          }
          let verifyResult: VerifyTransactionResult | undefined;
          if (foundTransaction === undefined) {
            verifyResult = await this.blockchain.verifyTransaction({
              transaction,
              memPool: Object.values(this.mutableMemPool),
            });
            const verified = verifyResult.verifications.every(({ failureMessage }) => failureMessage === undefined);

            if (verified) {
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

    return result;
  }

  public async relayBlock(block: Block): Promise<void> {
    await this.persistBlock(block);
  }

  public relayConsensusPayload(payload: ConsensusPayload): void {
    const message = this.createMessage({
      command: Command.inv,
      payload: new InvPayload({
        type: InventoryType.Consensus,
        hashes: [payload.hash],
      }),
    });

    this.consensusCache.set(payload.hashHex, payload);
    this.relay(message);
  }

  public syncMemPool(): void {
    this.relay(this.createMessage({ command: Command.mempool }));
  }

  private relay(message: Message): void {
    this.network.relay(message.serializeWire());
  }

  private relayTransactionInternal(transaction: Transaction): void {
    const message = this.createMessage({
      command: Command.inv,
      payload: new InvPayload({
        type: InventoryType.Transaction,
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
      this.createMessage({
        command: Command.version,
        payload: new VersionPayload({
          protocolVersion: 0,
          services: SERVICES.NODE_NETWORK,
          timestamp: Math.round(Date.now() / 1000),
          port: this.externalPort,
          nonce: this.nonce,
          userAgent: this.userAgent,
          startHeight: this.blockchain.currentBlockIndex,
          relay: true,
        }),
      }),
    );

    const message = await peer.receiveMessage(30000);
    let versionPayload;
    if (message.value.command === Command.version) {
      versionPayload = message.value.payload;
    } else {
      throw new NegotiationError(message);
    }

    this.checkVersion(peer, message, versionPayload);

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

    this.sendMessage(peer, this.createMessage({ command: Command.verack }));

    const nextMessage = await peer.receiveMessage(30000);
    if (nextMessage.value.command !== Command.verack) {
      throw new NegotiationError(nextMessage);
    }

    return {
      data: {
        nonce: versionPayload.nonce,
        startHeight: versionPayload.startHeight,
        mutableBloomFilter: undefined,
        address,
      },

      relay: versionPayload.relay,
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
        this.mutableBestPeer.data.startHeight + 100 < connectedPeer.data.startHeight
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
    const result = _.maxBy(peers, (peer) => peer.data.startHeight);
    if (result === undefined) {
      return undefined;
    }

    return _.shuffle(peers.filter((peer) => peer.data.startHeight === result.data.startHeight))[0];
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

    return peer !== undefined && block.index >= peer.data.startHeight;
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
    } catch (error) {
      logger.error(
        { name: 'neo_protocol_fetch_endpoints_error', [Labels.HTTP_URL]: rpcURL, error },
        `Failed to fetch endpoints from ${rpcURL}`,
      );
    }
  }

  private onMessageReceived(peer: ConnectedPeer<Message, PeerData>, message: Message): void {
    try {
      new Promise<void>(async (resolve) => {
        switch (message.value.command) {
          case Command.addr:
            this.onAddrMessageReceived(message.value.payload);
            break;
          case Command.block:
            await this.onBlockMessageReceived(peer, message.value.payload);

            break;
          case Command.consensus:
            await this.onConsensusMessageReceived(message.value.payload);

            break;
          case Command.filteradd:
            this.onFilterAddMessageReceived(peer, message.value.payload);

            break;
          case Command.filterclear:
            this.onFilterClearMessageReceived(peer);
            break;
          case Command.filterload:
            this.onFilterLoadMessageReceived(peer, message.value.payload);

            break;
          case Command.getaddr:
            this.onGetAddrMessageReceived(peer);
            break;
          case Command.getblocks:
            await this.onGetBlocksMessageReceived(peer, message.value.payload);

            break;
          case Command.getdata:
            await this.onGetDataMessageReceived(peer, message.value.payload);

            break;
          case Command.getheaders:
            await this.onGetHeadersMessageReceived(peer, message.value.payload);

            break;
          case Command.headers:
            await this.onHeadersMessageReceived(peer, message.value.payload);

            break;
          case Command.inv:
            this.onInvMessageReceived(peer, message.value.payload);
            break;
          case Command.mempool:
            this.onMemPoolMessageReceived(peer);
            break;
          case Command.tx:
            await this.onTransactionReceived(message.value.payload);
            break;
          case Command.verack:
            this.onVerackMessageReceived(peer);
            break;
          case Command.version:
            this.onVersionMessageReceived(peer);
            break;
          case Command.alert:
            break;
          case Command.merkleblock:
            break;
          case Command.notfound:
            break;
          case Command.ping:
            break;
          case Command.pong:
            break;
          case Command.reject:
            break;
          default:
            commonUtils.assertNever(message.value);
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
    addr.addresses
      .filter((address) => !LOCAL_HOST_ADDRESSES.has(address.host))
      .map((address) =>
        createEndpoint({
          type: 'tcp',
          host: address.host,
          port: address.port,
        }),
      )
      .forEach((endpoint) => this.network.addEndpoint(endpoint));
  }

  private async onBlockMessageReceived(peer: ConnectedPeer<Message, PeerData>, block: Block): Promise<void> {
    const blockIndex = this.mutableBlockIndex[peer.endpoint] as number | undefined;
    this.mutableBlockIndex[peer.endpoint] = Math.max(block.index, blockIndex === undefined ? 0 : blockIndex);

    await this.relayBlock(block);
  }

  private async persistBlock(block: Block): Promise<void> {
    if (this.blockchain.currentBlockIndex > block.index || this.tempKnownBlockHashes.has(block.hashHex)) {
      return;
    }

    if (!this.mutableKnownBlockHashes.has(block.hash)) {
      this.tempKnownBlockHashes.add(block.hashHex);

      try {
        const foundBlock = await this.blockchain.block.tryGet({
          hashOrIndex: block.hash,
        });

        if (foundBlock === undefined) {
          try {
            await this.blockchain.persistBlock({ block });
            if (this.mutableConsensus !== undefined) {
              this.mutableConsensus.onPersistBlock();
            }

            const peer = this.mutableBestPeer;
            if (peer !== undefined && block.index > peer.data.startHeight) {
              this.relay(
                this.createMessage({
                  command: Command.inv,
                  payload: new InvPayload({
                    type: InventoryType.Block,
                    hashes: [block.hash],
                  }),
                }),
              );
            }
            logger.info({ name: 'neo_relay_block', [Labels.NEO_BLOCK_INDEX]: block.index });
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
    const addresses = _.take(
      _.shuffle(
        this.network.connectedPeers.map((connectedPeer) => connectedPeer.data.address).filter(commonUtils.notNull),
      ),
      GET_ADDR_PEER_COUNT,
    );

    if (addresses.length > 0) {
      this.sendMessage(
        peer,
        this.createMessage({
          command: Command.addr,
          payload: new AddrPayload({ addresses }),
        }),
      );
    }
  }

  private async onGetBlocksMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    getBlocks: GetBlocksPayload,
  ): Promise<void> {
    const headers = await this.getHeaders(getBlocks, this.blockchain.currentBlockIndex);

    this.sendMessage(
      peer,
      this.createMessage({
        command: Command.inv,
        payload: new InvPayload({
          type: InventoryType.Block,
          hashes: headers.map((header) => header.hash),
        }),
      }),
    );
  }

  private async onGetDataMessageReceived(peer: ConnectedPeer<Message, PeerData>, getData: InvPayload): Promise<void> {
    switch (getData.type) {
      case InventoryType.Transaction:
        await Promise.all(
          getData.hashes.map(async (hash) => {
            let transaction = this.mutableMemPool[common.uInt256ToHex(hash)] as Transaction | undefined;
            if (transaction === undefined) {
              transaction = await this.blockchain.transaction.tryGet({ hash });
            }

            if (transaction !== undefined) {
              this.sendMessage(
                peer,
                this.createMessage({
                  command: Command.tx,
                  payload: transaction,
                }),
              );
            }
          }),
        );

        break;
      case InventoryType.Block: // Block
        await Promise.all(
          getData.hashes.map(async (hash) => {
            const block = await this.blockchain.block.tryGet({
              hashOrIndex: hash,
            });

            if (block !== undefined) {
              if (peer.data.mutableBloomFilter === undefined) {
                this.sendMessage(
                  peer,
                  this.createMessage({
                    command: Command.block,
                    payload: block,
                  }),
                );
              } else {
                this.sendMessage(
                  peer,
                  this.createMessage({
                    command: Command.merkleblock,
                    payload: this.createMerkleBlockPayload({
                      block,
                      flags: block.transactions.map((transaction) =>
                        this.testFilter(peer.data.mutableBloomFilter, transaction),
                      ),
                    }),
                  }),
                );
              }
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
              this.createMessage({
                command: Command.consensus,
                payload,
              }),
            );
          }
        });
        break;
      default:
        commonUtils.assertNever(getData.type);
    }
  }

  private async onGetHeadersMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    getBlocks: GetBlocksPayload,
  ): Promise<void> {
    const headers = await this.getHeaders(getBlocks, this.blockchain.currentHeader.index);

    this.sendMessage(
      peer,
      this.createMessage({
        command: Command.headers,
        payload: new HeadersPayload({ headers }),
      }),
    );
  }

  private async onHeadersMessageReceived(
    peer: ConnectedPeer<Message, PeerData>,
    headersPayload: HeadersPayload,
  ): Promise<void> {
    const headers = headersPayload.headers.filter(
      (header) => !this.mutableKnownHeaderHashes.has(header.hash) && !this.tempKnownHeaderHashes.has(header.hashHex),
    );

    if (headers.length > 0) {
      headers.forEach((header) => {
        this.tempKnownHeaderHashes.add(header.hashHex);
      });
      try {
        await this.blockchain.persistHeaders(headers);
        headers.forEach((header) => {
          this.mutableKnownHeaderHashes.add(header.hash);
        });
      } finally {
        headers.forEach((header) => {
          this.tempKnownHeaderHashes.delete(header.hashHex);
        });
      }
    }

    if (this.blockchain.currentHeader.index < peer.data.startHeight) {
      this.sendMessage(
        peer,
        this.createMessage({
          command: Command.getheaders,
          payload: new GetBlocksPayload({
            hashStart: [this.blockchain.currentHeader.hash],
          }),
        }),
      );
    }
  }

  private onInvMessageReceived(peer: ConnectedPeer<Message, PeerData>, inv: InvPayload): void {
    let hashes;
    switch (inv.type) {
      case InventoryType.Transaction: // Transaction
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
        this.createMessage({
          command: Command.getdata,
          payload: new InvPayload({ type: inv.type, hashes }),
        }),
      );
    }
  }

  private onMemPoolMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    this.sendMessage(
      peer,
      this.createMessage({
        command: Command.inv,
        payload: new InvPayload({
          type: InventoryType.Transaction,
          hashes: Object.values(this.mutableMemPool).map((transaction) => transaction.hash),
        }),
      }),
    );
  }

  private async onTransactionReceived(transaction: Transaction): Promise<void> {
    if (this.ready()) {
      if (transaction.type === TransactionType.Miner) {
        if (this.mutableConsensus !== undefined) {
          this.mutableConsensus.onTransactionReceived(transaction);
        }
      } else {
        await this.relayTransaction(transaction);
      }
    }
  }

  private onVerackMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    peer.close();
  }

  private onVersionMessageReceived(peer: ConnectedPeer<Message, PeerData>): void {
    peer.close();
  }

  private async getHeaders(getBlocks: GetBlocksPayload, maxHeight: number): Promise<readonly Header[]> {
    let hashStopIndexPromise = Promise.resolve(maxHeight);
    if (!getBlocks.hashStop.equals(common.ZERO_UINT256)) {
      hashStopIndexPromise = this.blockchain.header
        .tryGet({ hashOrIndex: getBlocks.hashStop })
        .then((hashStopHeader) =>
          hashStopHeader === undefined ? maxHeight : Math.min(hashStopHeader.index, maxHeight),
        );
    }
    const [hashStartHeaders, hashEnd] = await Promise.all([
      Promise.all(getBlocks.hashStart.map(async (hash) => this.blockchain.header.tryGet({ hashOrIndex: hash }))),

      hashStopIndexPromise,
    ]);

    const hashStartHeader = _.head(_.orderBy(hashStartHeaders.filter(commonUtils.notNull), [(header) => header.index]));

    if (hashStartHeader === undefined) {
      return [];
    }
    const hashStart = hashStartHeader.index + 1;
    if (hashStart > maxHeight) {
      return [];
    }

    return Promise.all(
      _.range(hashStart, Math.min(hashStart + GET_BLOCKS_COUNT, hashEnd)).map(async (index) =>
        this.blockchain.header.get({ hashOrIndex: index }),
      ),
    );
  }

  private testFilter(bloomFilterIn: BloomFilter | undefined, transaction: Transaction): boolean {
    const bloomFilter = bloomFilterIn;
    if (bloomFilter === undefined) {
      return true;
    }

    return (
      bloomFilter.contains(transaction.hash) ||
      transaction.outputs.some((output) => bloomFilter.contains(output.address)) ||
      transaction.inputs.some((input) => bloomFilter.contains(input.serializeWire())) ||
      transaction.scripts.some((script) => bloomFilter.contains(crypto.toScriptHash(script.verification))) ||
      (transaction.type === TransactionType.Register &&
        transaction instanceof RegisterTransaction &&
        bloomFilter.contains(transaction.asset.admin))
    );
  }

  private createMerkleBlockPayload({
    block,
    flags,
  }: {
    readonly block: Block;
    readonly flags: readonly boolean[];
  }): MerkleBlockPayload {
    const tree = new MerkleTree(block.transactions.map((transaction) => transaction.hash)).trim(flags);

    const mutableBuffer = Buffer.allocUnsafe(Math.floor((flags.length + 7) / 8));
    // tslint:disable-next-line no-loop-statement
    for (let i = 0; i < flags.length; i += 1) {
      if (flags[i]) {
        // tslint:disable-next-line no-bitwise
        mutableBuffer[Math.floor(i / 8)] |= 1 << i % 8;
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
      flags: mutableBuffer,
    });
  }

  private createMessage(value: MessageValue): Message {
    return new Message({
      magic: this.blockchain.settings.messageMagic,
      value,
    });
  }
}
