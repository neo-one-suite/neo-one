/* @flow */
import type BN from 'bn.js';

import {
  SCRIPT_CONTAINER_TYPE,
  type Block,
  type ConsensusPayload,
  type ECPoint,
  type Header,
  type Input,
  type InvocationResult,
  type Output,
  type OutputKey,
  type SerializableInvocationData,
  type Transaction,
  type TransactionBase,
  type TransactionData,
  type UInt160,
  type Validator,
  type VerifyScriptOptions,
  type Settings,
  InvocationTransaction,
  ScriptBuilder,
  common,
  crypto,
  utils,
} from '@neo-one/client-core';
import {
  NULL_ACTION,
  TRIGGER_TYPE,
  type Blockchain as BlockchainType,
  type Storage,
  type VM,
} from '@neo-one/node-core';
import {
  type Gauge,
  type Histogram,
  type Monitor,
  metrics,
} from '@neo-one/monitor';
import PriorityQueue from 'js-priority-queue';
import { BehaviorSubject, Subject } from 'rxjs';

import _ from 'lodash';
import { filter, map, toArray } from 'rxjs/operators';
import { labels, utils as commonUtils } from '@neo-one/utils';

import {
  CoinClaimedError,
  CoinUnspentError,
  GenesisBlockNotRegisteredError,
  InvalidClaimError,
  ScriptVerifyError,
  WitnessVerifyError,
  UnknownVerifyError,
} from './errors';
import WriteBatchBlockchain from './WriteBatchBlockchain';

import getValidators from './getValidators';
import wrapExecuteScripts from './wrapExecuteScripts';

export type CreateBlockchainOptions = {|
  settings: Settings,
  storage: Storage,
  vm: VM,
  monitor: Monitor,
|};

export type BlockchainOptions = {|
  ...CreateBlockchainOptions,
  currentBlock: ?$PropertyType<BlockchainType, 'currentBlock'>,
  currentHeader: ?$PropertyType<BlockchainType, 'currentHeader'>,
|};

type SpentCoin = {|
  output: Output,
  startHeight: number,
  endHeight: number,
  claimed: boolean,
|};

type Vote = {|
  publicKeys: Array<ECPoint>,
  count: BN,
|};

const NAMESPACE = 'blockchain';

const NEO_BLOCKCHAIN_PERSIST_BLOCK_DURATION_SECONDS = metrics.createHistogram({
  name: 'neo_blockchain_persist_block_duration_seconds',
});
const NEO_BLOCKCHAIN_PERSIST_BLOCK_FAILURES_TOTAL = metrics.createCounter({
  name: 'neo_blockchain_persist_block_failures_total',
});
const NEO_BLOCKCHAIN_BLOCK_INDEX_GAUGE = metrics.createGauge({
  name: 'neo_blockchain_block_index',
  help: 'The current block index',
});
const NEO_BLOCKCHAIN_PERSISTING_BLOCK_INDEX_GAUGE = metrics.createGauge({
  name: 'neo_blockchain_persisting_block_index',
  help: 'The current in progress persist index',
});
const NEO_BLOCKCHAIN_PERSIST_BLOCK_LATENCY_SECONDS = metrics.createHistogram({
  name: 'neo_blockchain_persist_block_latency_seconds',
  help: 'The latency from block timestamp to persist',
  buckets: [1, 2, 5, 7.5, 10, 12.5, 15, 17.5, 20],
});

export default class Blockchain {
  _monitor: Monitor;
  _blockIndexGauge: Gauge;
  _persistingBlockIndexGauge: Gauge;
  _persistBlockLatencyHistogram: Histogram;
  deserializeWireContext: $PropertyType<
    BlockchainType,
    'deserializeWireContext',
  >;
  serializeJSONContext: $PropertyType<BlockchainType, 'serializeJSONContext'>;
  feeContext: $PropertyType<BlockchainType, 'feeContext'>;

  account: $PropertyType<BlockchainType, 'account'>;
  accountUnclaimed: $PropertyType<BlockchainType, 'accountUnclaimed'>;
  accountUnspent: $PropertyType<BlockchainType, 'accountUnspent'>;
  action: $PropertyType<BlockchainType, 'action'>;
  asset: $PropertyType<BlockchainType, 'asset'>;
  block: $PropertyType<BlockchainType, 'block'>;
  blockData: $PropertyType<BlockchainType, 'blockData'>;
  header: $PropertyType<BlockchainType, 'header'>;
  transaction: $PropertyType<BlockchainType, 'transaction'>;
  transactionData: $PropertyType<BlockchainType, 'transactionData'>;
  output: $PropertyType<BlockchainType, 'output'>;
  contract: $PropertyType<BlockchainType, 'contract'>;
  storageItem: $PropertyType<BlockchainType, 'storageItem'>;
  validator: $PropertyType<BlockchainType, 'validator'>;
  invocationData: $PropertyType<BlockchainType, 'invocationData'>;
  validatorsCount: $PropertyType<BlockchainType, 'validatorsCount'>;

  _settings$: BehaviorSubject<Settings>;
  _storage: Storage;
  _currentBlock: ?$PropertyType<BlockchainType, 'currentBlock'>;
  _currentHeader: ?$PropertyType<BlockchainType, 'currentHeader'>;
  _persistingBlocks: boolean;
  _blockQueue: PriorityQueue;
  _inQueue: Set<number>;
  _vm: VM;
  _running: boolean;
  _doneRunningResolve: ?() => void;

  block$: Subject<Block>;

  constructor(options: BlockchainOptions) {
    this._storage = options.storage;
    this._currentBlock = options.currentBlock;
    this._currentHeader = options.currentHeader;
    this._vm = options.vm;

    this._settings$ = new BehaviorSubject(options.settings);
    this._monitor = options.monitor.at(NAMESPACE);
    NEO_BLOCKCHAIN_BLOCK_INDEX_GAUGE.set(this.currentBlockIndex);
    NEO_BLOCKCHAIN_PERSISTING_BLOCK_INDEX_GAUGE.set(this.currentBlockIndex);
    this.account = this._storage.account;
    this.accountUnclaimed = this._storage.accountUnclaimed;
    this.accountUnspent = this._storage.accountUnspent;
    this.action = this._storage.action;
    this.asset = this._storage.asset;
    this.block = {
      get: this._storage.block.get,
      tryGet: this._storage.block.tryGet,
    };
    this.blockData = this._storage.blockData;
    this.header = {
      get: this._storage.header.get,
      tryGet: this._storage.header.tryGet,
    };
    this.transaction = this._storage.transaction;
    this.transactionData = this._storage.transactionData;
    this.output = this._storage.output;
    this.contract = this._storage.contract;
    this.storageItem = this._storage.storageItem;
    this.validator = this._storage.validator;
    this.invocationData = this._storage.invocationData;
    this.validatorsCount = this._storage.validatorsCount;

    this.deserializeWireContext = {
      messageMagic: this.settings.messageMagic,
    };
    this.feeContext = {
      getOutput: this.output.get,
      governingToken: this.settings.governingToken,
      utilityToken: this.settings.utilityToken,
      fees: this.settings.fees,
      registerValidatorFee: this.settings.registerValidatorFee,
    };
    this.serializeJSONContext = {
      addressVersion: this.settings.addressVersion,
      feeContext: this.feeContext,
      tryGetInvocationData: this._tryGetInvocationData,
      tryGetTransactionData: this._tryGetTransactionData,
      getUnclaimed: this._getUnclaimed,
      getUnspent: this._getUnspent,
    };

    this._start();
  }

  static async create({
    settings,
    storage,
    vm,
    monitor,
  }: CreateBlockchainOptions): Promise<BlockchainType> {
    const [currentBlock, currentHeader] = await Promise.all([
      storage.block.tryGetLatest(),
      storage.header.tryGetLatest(),
    ]);

    const blockchain = new Blockchain({
      currentBlock,
      currentHeader,
      settings,
      storage,
      vm,
      monitor,
    });

    if (currentHeader == null) {
      await blockchain.persistHeaders([settings.genesisBlock.header]);
    }

    if (currentBlock == null) {
      await blockchain.persistBlock({ block: settings.genesisBlock });
    }

    return blockchain;
  }

  _start(): void {
    this.block$ = new Subject();
    this._persistingBlocks = false;
    this._blockQueue = new PriorityQueue({
      comparator: (a, b) => a.block.index - b.block.index,
    });
    this._inQueue = new Set();
    this._doneRunningResolve = null;
    this._running = true;
    this._monitor.log({ name: 'neo_blockchain_start' });
  }

  async stop(): Promise<void> {
    if (!this._running) {
      return;
    }

    if (this._persistingBlocks) {
      const doneRunningPromise = new Promise((resolve) => {
        this._doneRunningResolve = resolve;
      });
      this._running = false;

      await doneRunningPromise;
      this._doneRunningResolve = null;
    } else {
      this._running = false;
    }

    this._monitor.log({ name: 'neo_blockchain_stop' });
  }

  get currentBlock(): Block {
    if (this._currentBlock == null) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this._currentBlock;
  }

  get currentHeader(): Header {
    if (this._currentHeader == null) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this._currentHeader;
  }

  get currentBlockIndex(): number {
    return this._currentBlock == null ? -1 : this._currentBlock.index;
  }

  get isPersistingBlock(): boolean {
    return this._persistingBlocks;
  }

  get settings(): Settings {
    return this._settings$.getValue();
  }

  updateSettings(settings: Settings): void {
    this._settings$.next(settings);
  }

  persistBlock({
    monitor,
    block,
    unsafe,
  }: {|
    monitor?: Monitor,
    block: Block,
    unsafe?: boolean,
  |}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this._inQueue.has(block.index)) {
        return;
      }
      this._inQueue.add(block.index);

      this._blockQueue.queue({
        monitor: this._getMonitor(monitor),
        block,
        resolve,
        reject,
        unsafe,
      });
      this._persistBlocksAsync();
    });
  }

  // eslint-disable-next-line
  async persistHeaders(headers: Array<Header>): Promise<void> {
    // We don't ever just persist the headers.
  }

  async verifyBlock(block: Block, monitor?: Monitor): Promise<void> {
    await this._getMonitor(monitor)
      .withData({ [labels.NEO_BLOCK_INDEX]: block.index })
      .captureSpan(
        (span) =>
          block.verify({
            genesisBlock: this.settings.genesisBlock,
            tryGetBlock: this.block.tryGet,
            tryGetHeader: this.header.tryGet,
            isSpent: this._isSpent,
            getAsset: this.asset.get,
            getOutput: this.output.get,
            tryGetAccount: this.account.tryGet,
            getValidators: this.getValidators,
            standbyValidators: this.settings.standbyValidators,
            getAllValidators: this._getAllValidators,
            calculateClaimAmount: (claims) =>
              this.calculateClaimAmount(claims, span),
            verifyScript: (options) => this.verifyScript(options, span),
            currentHeight:
              this._currentBlock == null ? 0 : this._currentBlock.index,
            governingToken: this.settings.governingToken,
            utilityToken: this.settings.utilityToken,
            fees: this.settings.fees,
            registerValidatorFee: this.settings.registerValidatorFee,
          }),
        { name: 'neo_blockchain_verify_block' },
      );
  }

  async verifyConsensusPayload(
    payload: ConsensusPayload,
    monitor?: Monitor,
  ): Promise<void> {
    await this._getMonitor(monitor)
      .withData({ [labels.NEO_CONSENSUS_HASH]: payload.hashHex })
      .captureSpan(
        (span) =>
          payload.verify({
            getValidators: () => this.getValidators([], span),
            verifyScript: (options) => this.verifyScript(options, span),
            currentIndex:
              this._currentBlock == null ? 0 : this._currentBlock.index,
            currentBlockHash: this.currentBlock.hash,
          }),
        { name: 'neo_blockchain_verify_consensus' },
      );
  }

  async verifyTransaction({
    monitor,
    transaction,
    memPool,
  }: {
    monitor?: Monitor,
    transaction: Transaction,
    memPool?: Array<Transaction>,
  }): Promise<void> {
    try {
      await this._getMonitor(monitor)
        .withData({ [labels.NEO_TRANSACTION_HASH]: transaction.hashHex })
        .captureSpan(
          (span) =>
            transaction.verify({
              calculateClaimAmount: this.calculateClaimAmount,
              isSpent: this._isSpent,
              getAsset: this.asset.get,
              getOutput: this.output.get,
              tryGetAccount: this.account.tryGet,
              standbyValidators: this.settings.standbyValidators,
              getAllValidators: this._getAllValidators,
              verifyScript: (options) => this.verifyScript(options, span),
              governingToken: this.settings.governingToken,
              utilityToken: this.settings.utilityToken,
              fees: this.settings.fees,
              registerValidatorFee: this.settings.registerValidatorFee,
              currentHeight: this.currentBlockIndex,
              memPool,
            }),
          { name: 'neo_blockchain_verify_transaction' },
        );
    } catch (error) {
      if (
        error.code == null ||
        typeof error.code !== 'string' ||
        !error.code.includes('VERIFY')
      ) {
        throw new UnknownVerifyError(error.message);
      }

      throw error;
    }
  }

  async invokeScript(
    script: Buffer,
    monitor?: Monitor,
  ): Promise<InvocationResult> {
    const transaction = new InvocationTransaction({
      script,
      gas: common.ONE_HUNDRED_FIXED8,
    });

    return this.invokeTransaction(transaction, monitor);
  }

  async invokeTransaction(
    transaction: InvocationTransaction,
    monitor?: Monitor,
  ): Promise<InvocationResult> {
    const blockchain = this._createWriteBlockchain();

    return wrapExecuteScripts(() =>
      this._vm.executeScripts({
        monitor: this._getMonitor(monitor),
        scripts: [{ code: transaction.script }],
        blockchain,
        scriptContainer: {
          type: SCRIPT_CONTAINER_TYPE.TRANSACTION,
          value: transaction,
        },
        triggerType: TRIGGER_TYPE.APPLICATION,
        action: NULL_ACTION,
        gas: transaction.gas,
        skipWitnessVerify: true,
      }),
    );
  }

  async _persistBlocksAsync(): Promise<void> {
    if (this._persistingBlocks || !this._running) {
      return;
    }

    this._persistingBlocks = true;
    let entry;
    try {
      this.cleanBlockQueue();
      entry = this.peekBlockQueue();
      while (
        this._running &&
        entry != null &&
        entry.block.index === this.currentBlockIndex + 1
      ) {
        entry = this._blockQueue.dequeue();
        const entryNonNull = entry;
        // eslint-disable-next-line
        await (entry.monitor: Monitor)
          .withData({ [labels.NEO_BLOCK_INDEX]: entry.block.index })
          .captureSpanLog(
            (span) =>
              this._persistBlock(span, entryNonNull.block, entryNonNull.unsafe),
            {
              name: 'neo_blockchain_persist_block_top_level',
              level: { log: 'verbose', span: 'info' },
              metric: {
                total: NEO_BLOCKCHAIN_PERSIST_BLOCK_DURATION_SECONDS,
                error: NEO_BLOCKCHAIN_PERSIST_BLOCK_FAILURES_TOTAL,
              },
              trace: true,
            },
          );
        entry.resolve();
        this.block$.next(entry.block);
        NEO_BLOCKCHAIN_BLOCK_INDEX_GAUGE.set(entry.block.index);
        NEO_BLOCKCHAIN_PERSIST_BLOCK_LATENCY_SECONDS.observe(
          this._monitor.nowSeconds() - entry.block.timestamp,
        );
        this.cleanBlockQueue();
        entry = this.peekBlockQueue();
      }
    } catch (error) {
      if (entry != null) {
        entry.reject(error);
      }
    } finally {
      this._persistingBlocks = false;
      if (this._doneRunningResolve != null) {
        this._doneRunningResolve();
        this._doneRunningResolve = null;
      }
    }
  }

  cleanBlockQueue(): void {
    let entry = this.peekBlockQueue();
    while (entry != null && entry.block.index <= this.currentBlockIndex) {
      this._blockQueue.dequeue();
      entry.resolve();
      entry = this.peekBlockQueue();
    }
  }

  peekBlockQueue(): ?{
    block: Block,
    resolve: () => void,
    reject: (error: Error) => void,
    unsafe?: boolean,
  } {
    if (this._blockQueue.length > 0) {
      return this._blockQueue.peek();
    }

    return null;
  }

  async _persistBlock(
    monitor: Monitor,
    block: Block,
    unsafe?: boolean,
  ): Promise<void> {
    NEO_BLOCKCHAIN_PERSISTING_BLOCK_INDEX_GAUGE.set(block.index);
    if (!unsafe) {
      await this.verifyBlock(block, monitor);
    }

    const blockchain = this._createWriteBlockchain();

    await blockchain.persistBlock(monitor, block);

    await monitor.captureSpan(
      () => this._storage.commit(blockchain.getChangeSet()),
      { name: 'neo_blockchain_persist_block_commit_storage' },
    );

    this._currentBlock = block;
    this._currentHeader = block.header;
  }

  verifyScript = async (
    { scriptContainer, hash, witness }: VerifyScriptOptions,
    monitor: Monitor,
  ): Promise<void> => {
    let { verification } = witness;
    if (verification.length === 0) {
      const builder = new ScriptBuilder();
      builder.emitAppCallVerification(hash);
      verification = builder.build();
    } else if (!common.uInt160Equal(hash, crypto.toScriptHash(verification))) {
      throw new WitnessVerifyError();
    }

    const blockchain = this._createWriteBlockchain();
    const result = await this._vm.executeScripts({
      monitor: this._getMonitor(monitor),
      scripts: [
        { code: witness.invocation, pushOnly: true },
        { code: verification },
      ],
      blockchain,
      scriptContainer,
      triggerType: TRIGGER_TYPE.VERIFICATION,
      action: NULL_ACTION,
      gas: utils.ZERO,
    });

    const { stack } = result;
    if (stack.length !== 1) {
      throw new ScriptVerifyError(
        `Verification did not return one result. This may be a bug in the ` +
          `smart contract. Found ${stack.length} results.`,
      );
    }

    const top = stack[0];
    if (!top.asBoolean()) {
      throw new ScriptVerifyError('Verification did not succeed.');
    }
  };

  calculateClaimAmount = async (
    claims: Array<Input>,
    monitor?: Monitor,
  ): Promise<BN> =>
    this._getMonitor(monitor).captureSpanLog(
      async () => {
        const spentCoins = await Promise.all(
          claims.map((claim) => this._tryGetSpentCoin(claim)),
        );
        const filteredSpentCoins = spentCoins.filter(Boolean);
        if (spentCoins.length !== filteredSpentCoins.length) {
          throw new CoinUnspentError();
        }

        if (filteredSpentCoins.some((coin) => coin.claimed)) {
          throw new CoinClaimedError();
        }

        if (
          filteredSpentCoins.some(
            (coin) =>
              !common.uInt256Equal(
                coin.output.asset,
                this.settings.governingToken.hash,
              ),
          )
        ) {
          throw new InvalidClaimError();
        }

        return utils.calculateClaimAmount({
          coins: filteredSpentCoins.map((coin) => ({
            value: coin.output.value,
            startHeight: coin.startHeight,
            endHeight: coin.endHeight,
          })),
          decrementInterval: this.settings.decrementInterval,
          generationAmount: this.settings.generationAmount,
          getSystemFee: async (index) => {
            const header = await this._storage.header.get({
              hashOrIndex: index,
            });
            const blockData = await this._storage.blockData.get({
              hash: header.hash,
            });
            return blockData.systemFee;
          },
        });
      },
      {
        name: 'neo_blockchain_calculate_claim_amount',
        level: { log: 'verbose', span: 'info' },
      },
    );

  async reset(): Promise<void> {
    await this.stop();
    await this._storage.reset();
    this._currentHeader = null;
    this._currentBlock = null;
    this._start();
    await this.persistHeaders([this.settings.genesisBlock.header]);
    await this.persistBlock({ block: this.settings.genesisBlock });
  }

  _isSpent = async (input: OutputKey): Promise<boolean> => {
    const transactionData = await this.transactionData.tryGet({
      hash: input.hash,
    });

    return (
      transactionData != null && transactionData.endHeights[input.index] != null
    );
  };

  _tryGetSpentCoin = async (input: Input): Promise<?SpentCoin> => {
    const [transactionData, output] = await Promise.all([
      this.transactionData.tryGet({ hash: input.hash }),
      this.output.get(input),
    ]);
    if (transactionData == null) {
      return null;
    }

    const endHeight = transactionData.endHeights[input.index];
    if (endHeight == null) {
      return null;
    }

    const claimed = transactionData.claimed[input.index];

    return {
      output,
      startHeight: transactionData.startHeight,
      endHeight,
      claimed: !!claimed,
    };
  };

  getValidators = async (
    transactions: Array<Transaction>,
    monitor?: Monitor,
  ): Promise<Array<ECPoint>> =>
    this._getMonitor(monitor).captureSpanLog(
      () => getValidators(this, transactions),
      {
        name: 'neo_blockchain_get_validators',
        level: { log: 'verbose', span: 'info' },
      },
    );

  _getVotes = async (
    transactions: Array<Transaction>,
  ): Promise<Array<Vote>> => {
    const inputs = await Promise.all(
      transactions.map((transaction) =>
        transaction.getReferences({
          getOutput: this.output.get,
        }),
      ),
    ).then((results) =>
      results
        .reduce((acc, inputResults) => acc.concat(inputResults), [])
        .map((output) => ({
          address: output.address,
          asset: output.asset,
          value: output.value.neg(),
        })),
    );
    const outputs = transactions
      .reduce((acc, transaction) => acc.concat(transaction.outputs), [])
      .map((output) => ({
        address: output.address,
        asset: output.asset,
        value: output.value,
      }));
    const changes = _.fromPairs(
      commonUtils
        .entries(
          _.groupBy(
            inputs
              .concat(outputs)
              .filter((output) =>
                common.uInt256Equal(
                  output.asset,
                  this.settings.governingToken.hash,
                ),
              ),
            (output) => common.uInt160ToHex(output.address),
          ),
        )
        .map(([addressHex, addressOutputs]) => [
          addressHex,
          addressOutputs.reduce(
            (acc, output) => acc.add(output.value),
            utils.ZERO,
          ),
        ]),
    );
    const votes = await this.account.all
      .pipe(
        filter((account) => account.votes.length > 0),
        map((account) => {
          let balance =
            account.balances[this.settings.governingToken.hashHex] ||
            utils.ZERO;
          balance = balance.add(changes[account.hashHex] || utils.ZERO);
          return balance.lte(utils.ZERO)
            ? null
            : {
                publicKeys: account.votes,
                count: balance,
              };
        }),
        toArray(),
      )
      .toPromise();
    if (votes.length === 0) {
      return [
        {
          publicKeys: this.settings.standbyValidators,
          count: this.settings.governingToken.asset.amount,
        },
      ];
    }

    return votes.filter(Boolean);
  };

  _createWriteBlockchain(): WriteBatchBlockchain {
    return new WriteBatchBlockchain({
      settings: this.settings,
      currentBlock: this._currentBlock,
      currentHeader: this._currentHeader,
      storage: this._storage,
      vm: this._vm,
      getValidators: this.getValidators,
    });
  }

  _tryGetInvocationData = async (
    transaction: InvocationTransaction,
  ): Promise<?SerializableInvocationData> => {
    const data = await this._storage.invocationData.tryGet({
      hash: transaction.hash,
    });
    if (data == null) {
      return null;
    }

    const [asset, contracts, actions] = await Promise.all([
      data.assetHash == null
        ? Promise.resolve(null)
        : this._storage.asset.get({ hash: data.assetHash }),
      Promise.all(
        data.contractHashes.map((contractHash) =>
          this._storage.contract.get({ hash: contractHash }),
        ),
      ),
      data.actionIndexStart.eq(data.actionIndexStop)
        ? Promise.resolve([])
        : this._storage.action
            .getAll({
              indexStart: data.actionIndexStart,
              indexStop: data.actionIndexStop.sub(utils.ONE),
            })
            .pipe(toArray())
            .toPromise(),
    ]);

    return {
      asset,
      contracts,
      deletedContractHashes: data.deletedContractHashes,
      migratedContractHashes: data.migratedContractHashes,
      voteUpdates: data.voteUpdates,
      result: data.result,
      actions,
    };
  };

  _tryGetTransactionData = async (
    transaction: TransactionBase<any, any>,
  ): Promise<?TransactionData> =>
    this.transactionData.tryGet({ hash: transaction.hash });

  _getUnclaimed = (hash: UInt160): Promise<Array<Input>> =>
    this._storage.accountUnclaimed
      .getAll({ hash })
      .pipe(toArray())
      .toPromise()
      .then((values) => values.map((value) => value.input));

  _getUnspent = async (hash: UInt160): Promise<Array<Input>> => {
    const unspent = await this._storage.accountUnspent
      .getAll({ hash })
      .pipe(toArray())
      .toPromise();
    return unspent.map((value) => value.input);
  };

  _getAllValidators = (): Promise<Array<Validator>> =>
    this.validator.all.pipe(toArray()).toPromise();

  _getMonitor(monitor?: Monitor): Monitor {
    if (monitor == null) {
      return this._monitor;
    }

    return monitor.at(NAMESPACE);
  }
}
