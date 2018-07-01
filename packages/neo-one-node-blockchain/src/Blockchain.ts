import {
  Block,
  common,
  ConsensusPayload,
  crypto,
  ECPoint,
  Header,
  Input,
  InvocationResult,
  InvocationTransaction,
  Output,
  OutputKey,
  ScriptBuilder,
  ScriptContainerType,
  SerializableInvocationData,
  Settings,
  Transaction,
  TransactionBase,
  TransactionData,
  UInt160,
  utils,
  Validator,
  VerifyScriptOptions,
} from '@neo-one/client-core';
import { metrics, Monitor } from '@neo-one/monitor';
import { Blockchain as BlockchainType, NULL_ACTION, Storage, TriggerType, VM } from '@neo-one/node-core';
import { labels, utils as commonUtils } from '@neo-one/utils';
import { BN } from 'bn.js';
import PriorityQueue from 'js-priority-queue';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { toArray } from 'rxjs/operators';
import {
  CoinClaimedError,
  CoinUnspentError,
  GenesisBlockNotRegisteredError,
  InvalidClaimError,
  ScriptVerifyError,
  UnknownVerifyError,
  WitnessVerifyError,
} from './errors';
import { getValidators } from './getValidators';
import { wrapExecuteScripts } from './wrapExecuteScripts';
import { WriteBatchBlockchain } from './WriteBatchBlockchain';

export interface CreateBlockchainOptions {
  readonly settings: Settings;
  readonly storage: Storage;
  readonly vm: VM;
  readonly monitor: Monitor;
}
export interface BlockchainOptions extends CreateBlockchainOptions {
  readonly currentBlock: BlockchainType['currentBlock'] | undefined;
  readonly previousBlock: BlockchainType['previousBlock'] | undefined;
  readonly currentHeader: BlockchainType['currentHeader'] | undefined;
}

interface SpentCoin {
  readonly output: Output;
  readonly startHeight: number;
  readonly endHeight: number;
  readonly claimed: boolean;
}

interface Entry {
  readonly monitor: Monitor;
  readonly block: Block;
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
  readonly unsafe: boolean;
}

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

export class Blockchain {
  public static async create({ settings, storage, vm, monitor }: CreateBlockchainOptions): Promise<BlockchainType> {
    const [currentBlock, currentHeader] = await Promise.all([
      storage.block.tryGetLatest(),
      storage.header.tryGetLatest(),
    ]);
    let previousBlock;
    if (currentBlock !== undefined) {
      previousBlock = await storage.block.tryGet({ hashOrIndex: currentBlock.index - 1 });
    }

    const blockchain = new Blockchain({
      currentBlock,
      currentHeader,
      previousBlock,
      settings,
      storage,
      vm,
      monitor,
    });

    if (currentHeader === undefined) {
      await blockchain.persistHeaders([settings.genesisBlock.header]);
    }

    if (currentBlock === undefined) {
      await blockchain.persistBlock({ block: settings.genesisBlock });
    }

    return blockchain;
  }

  public readonly deserializeWireContext: BlockchainType['deserializeWireContext'];
  public readonly serializeJSONContext: BlockchainType['serializeJSONContext'];
  public readonly feeContext: BlockchainType['feeContext'];

  private readonly monitor: Monitor;
  private readonly settings$: BehaviorSubject<Settings>;
  private readonly storage: Storage;
  private mutableCurrentBlock: BlockchainType['currentBlock'] | undefined;
  private mutablePreviousBlock: BlockchainType['currentBlock'] | undefined;
  private mutableCurrentHeader: BlockchainType['currentHeader'] | undefined;
  private mutablePersistingBlocks = false;
  private mutableBlockQueue: PriorityQueue<Entry> = new PriorityQueue({
    comparator: (a, b) => a.block.index - b.block.index,
  });
  private mutableInQueue: Set<string> = new Set();
  private readonly vm: VM;
  private mutableRunning = false;
  private mutableDoneRunningResolve: (() => void) | undefined;
  private mutableBlock$: Subject<Block> = new Subject();
  private mutableWriteBlockchain: WriteBatchBlockchain | undefined;

  public constructor(options: BlockchainOptions) {
    this.storage = options.storage;
    this.mutableCurrentBlock = options.currentBlock;
    this.mutablePreviousBlock = options.previousBlock;
    this.mutableCurrentHeader = options.currentHeader;
    this.vm = options.vm;

    this.settings$ = new BehaviorSubject(options.settings);
    this.monitor = options.monitor.at(NAMESPACE);
    NEO_BLOCKCHAIN_BLOCK_INDEX_GAUGE.set(this.currentBlockIndex);
    NEO_BLOCKCHAIN_PERSISTING_BLOCK_INDEX_GAUGE.set(this.currentBlockIndex);

    // tslint:disable-next-line no-this-assignment
    const self = this;
    this.deserializeWireContext = {
      get messageMagic() {
        return self.settings.messageMagic;
      },
    };

    this.feeContext = {
      get getOutput() {
        return self.output.get;
      },
      get governingToken() {
        return self.settings.governingToken;
      },
      get utilityToken() {
        return self.settings.utilityToken;
      },
      get fees() {
        return self.settings.fees;
      },
      get registerValidatorFee() {
        return self.settings.registerValidatorFee;
      },
    };

    this.serializeJSONContext = {
      get addressVersion() {
        return self.settings.addressVersion;
      },
      get feeContext() {
        return self.feeContext;
      },
      get tryGetInvocationData() {
        return self.tryGetInvocationData;
      },
      get tryGetTransactionData() {
        return self.tryGetTransactionData;
      },
      get getUnclaimed() {
        return self.getUnclaimed;
      },
      get getUnspent() {
        return self.getUnspent;
      },
    };

    this.mutableWriteBlockchain = this.createWriteBlockchain();

    this.start();
  }

  public get settings(): Settings {
    return this.settings$.getValue();
  }

  public get currentBlock(): Block {
    if (this.mutableCurrentBlock === undefined) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this.mutableCurrentBlock;
  }

  public get previousBlock(): Block | undefined {
    return this.mutablePreviousBlock;
  }

  public get currentHeader(): Header {
    if (this.mutableCurrentHeader === undefined) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this.mutableCurrentHeader;
  }

  public get currentBlockIndex(): number {
    return this.mutableCurrentBlock === undefined ? -1 : this.currentBlock.index;
  }

  public get block$(): Observable<Block> {
    return this.mutableBlock$;
  }

  public get isPersistingBlock(): boolean {
    return this.mutablePersistingBlocks;
  }

  public get account(): BlockchainType['account'] {
    return this.mutableWriteBlockchain === undefined ? this.storage.account : this.mutableWriteBlockchain.account;
  }

  public get accountUnclaimed(): BlockchainType['accountUnclaimed'] {
    return this.mutableWriteBlockchain === undefined
      ? this.storage.accountUnclaimed
      : this.mutableWriteBlockchain.accountUnclaimed;
  }

  public get accountUnspent(): BlockchainType['accountUnspent'] {
    return this.mutableWriteBlockchain === undefined
      ? this.storage.accountUnspent
      : this.mutableWriteBlockchain.accountUnspent;
  }

  public get action(): BlockchainType['action'] {
    return this.mutableWriteBlockchain === undefined ? this.storage.action : this.mutableWriteBlockchain.action;
  }

  public get asset(): BlockchainType['asset'] {
    return this.mutableWriteBlockchain === undefined ? this.storage.asset : this.mutableWriteBlockchain.asset;
  }

  public get block(): BlockchainType['block'] {
    return this.mutableWriteBlockchain === undefined ? this.storage.block : this.mutableWriteBlockchain.block;
  }

  public get blockData(): BlockchainType['blockData'] {
    return this.mutableWriteBlockchain === undefined ? this.storage.blockData : this.mutableWriteBlockchain.blockData;
  }

  public get header(): BlockchainType['header'] {
    return this.mutableWriteBlockchain === undefined ? this.storage.header : this.mutableWriteBlockchain.header;
  }

  public get transaction(): BlockchainType['transaction'] {
    return this.mutableWriteBlockchain === undefined
      ? this.storage.transaction
      : this.mutableWriteBlockchain.transaction;
  }

  public get transactionData(): BlockchainType['transactionData'] {
    return this.mutableWriteBlockchain === undefined
      ? this.storage.transactionData
      : this.mutableWriteBlockchain.transactionData;
  }

  public get output(): BlockchainType['output'] {
    return this.mutableWriteBlockchain === undefined ? this.storage.output : this.mutableWriteBlockchain.output;
  }

  public get contract(): BlockchainType['contract'] {
    return this.mutableWriteBlockchain === undefined ? this.storage.contract : this.mutableWriteBlockchain.contract;
  }

  public get storageItem(): BlockchainType['storageItem'] {
    return this.mutableWriteBlockchain === undefined
      ? this.storage.storageItem
      : this.mutableWriteBlockchain.storageItem;
  }

  public get validator(): BlockchainType['validator'] {
    return this.mutableWriteBlockchain === undefined ? this.storage.validator : this.mutableWriteBlockchain.validator;
  }

  public get invocationData(): BlockchainType['invocationData'] {
    return this.mutableWriteBlockchain === undefined
      ? this.storage.invocationData
      : this.mutableWriteBlockchain.invocationData;
  }

  public get validatorsCount(): BlockchainType['validatorsCount'] {
    return this.mutableWriteBlockchain === undefined
      ? this.storage.validatorsCount
      : this.mutableWriteBlockchain.validatorsCount;
  }

  public async stop(): Promise<void> {
    if (!this.mutableRunning) {
      return;
    }

    if (this.mutablePersistingBlocks) {
      // tslint:disable-next-line promise-must-complete
      const doneRunningPromise = new Promise<void>((resolve) => {
        this.mutableDoneRunningResolve = resolve;
      });
      this.mutableRunning = false;

      await doneRunningPromise;
      this.mutableDoneRunningResolve = undefined;
    } else {
      this.mutableRunning = false;
    }

    this.monitor.log({ name: 'neo_blockchain_stop' });
  }

  public updateSettings(settings: Settings): void {
    this.settings$.next(settings);
  }

  public async persistBlock({
    monitor,
    block,
    unsafe = false,
  }: {
    readonly monitor?: Monitor;
    readonly block: Block;
    readonly unsafe?: boolean;
  }): Promise<void> {
    // tslint:disable-next-line promise-must-complete
    return new Promise<void>((resolve, reject) => {
      if (this.mutableInQueue.has(block.hashHex)) {
        return;
      }
      this.mutableInQueue.add(block.hashHex);

      this.mutableBlockQueue.queue({
        monitor: this.getMonitor(monitor),
        block,
        resolve,
        reject,
        unsafe,
      });

      // tslint:disable-next-line no-floating-promises
      this.persistBlocksAsync();
    });
  }

  public async persistHeaders(_headers: ReadonlyArray<Header>): Promise<void> {
    // We don't ever just persist the headers.
  }

  public async verifyBlock(block: Block, monitor?: Monitor): Promise<void> {
    await this.getMonitor(monitor)
      .withData({ [labels.NEO_BLOCK_INDEX]: block.index })
      .captureSpan(
        async (span) =>
          block.verify({
            genesisBlock: this.settings.genesisBlock,
            tryGetBlock: this.block.tryGet,
            tryGetHeader: this.header.tryGet,
            isSpent: this.isSpent,
            getAsset: this.asset.get,
            getOutput: this.output.get,
            tryGetAccount: this.account.tryGet,
            getValidators: this.getValidators,
            standbyValidators: this.settings.standbyValidators,
            getAllValidators: this.getAllValidators,
            calculateClaimAmount: async (claims) => this.calculateClaimAmount(claims, span),
            verifyScript: async (options) => this.verifyScript(options, span),
            currentHeight: this.mutableCurrentBlock === undefined ? 0 : this.mutableCurrentBlock.index,
            governingToken: this.settings.governingToken,
            utilityToken: this.settings.utilityToken,
            fees: this.settings.fees,
            registerValidatorFee: this.settings.registerValidatorFee,
          }),

        { name: 'neo_blockchain_verify_block' },
      );
  }

  public async verifyConsensusPayload(payload: ConsensusPayload, monitor?: Monitor): Promise<void> {
    await this.getMonitor(monitor)
      .withData({ [labels.NEO_CONSENSUS_HASH]: payload.hashHex })
      .captureSpan(
        async (span) =>
          payload.verify({
            getValidators: async () => this.getValidators([], span),
            verifyScript: async (options) => this.verifyScript(options, span),
            currentIndex: this.mutableCurrentBlock === undefined ? 0 : this.mutableCurrentBlock.index,
            currentBlockHash: this.currentBlock.hash,
          }),

        { name: 'neo_blockchain_verify_consensus' },
      );
  }

  public async verifyTransaction({
    monitor,
    transaction,
    memPool,
  }: {
    readonly monitor?: Monitor;
    readonly transaction: Transaction;
    readonly memPool?: ReadonlyArray<Transaction>;
  }): Promise<void> {
    try {
      await this.getMonitor(monitor)
        .withData({ [labels.NEO_TRANSACTION_HASH]: transaction.hashHex })
        .captureSpan(
          async (span) =>
            transaction.verify({
              calculateClaimAmount: this.calculateClaimAmount,
              isSpent: this.isSpent,
              getAsset: this.asset.get,
              getOutput: this.output.get,
              tryGetAccount: this.account.tryGet,
              standbyValidators: this.settings.standbyValidators,
              getAllValidators: this.getAllValidators,
              verifyScript: async (options) => this.verifyScript(options, span),
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
      if (error.code === undefined || typeof error.code !== 'string' || !error.code.includes('VERIFY')) {
        throw new UnknownVerifyError(error.message);
      }

      throw error;
    }
  }

  public async invokeScript(script: Buffer, monitor?: Monitor): Promise<InvocationResult> {
    const transaction = new InvocationTransaction({
      script,
      gas: common.ONE_HUNDRED_FIXED8,
    });

    return this.invokeTransaction(transaction, monitor);
  }

  public async invokeTransaction(transaction: InvocationTransaction, monitor?: Monitor): Promise<InvocationResult> {
    const blockchain = this.createWriteBlockchain();

    return wrapExecuteScripts(async () =>
      this.vm.executeScripts({
        monitor: this.getMonitor(monitor),
        scripts: [{ code: transaction.script }],
        blockchain,
        scriptContainer: {
          type: ScriptContainerType.Transaction,
          value: transaction,
        },

        triggerType: TriggerType.Application,
        action: NULL_ACTION,
        gas: transaction.gas,
        skipWitnessVerify: true,
      }),
    );
  }

  public async reset(): Promise<void> {
    await this.stop();
    await this.storage.reset();
    this.mutableCurrentHeader = undefined;
    this.mutableCurrentBlock = undefined;
    this.mutablePreviousBlock = undefined;
    this.mutableWriteBlockchain = undefined;
    this.mutableWriteBlockchain = this.createWriteBlockchain();
    this.start();
    await this.persistHeaders([this.settings.genesisBlock.header]);
    await this.persistBlock({ block: this.settings.genesisBlock });
  }

  public readonly getValidators = async (
    transactions: ReadonlyArray<Transaction>,
    monitor?: Monitor,
  ): Promise<ReadonlyArray<ECPoint>> =>
    this.getMonitor(monitor).captureSpanLog(async () => getValidators(this, transactions), {
      name: 'neo_blockchain_get_validators',
      level: { log: 'verbose', span: 'info' },
    });

  public readonly calculateClaimAmount = async (claims: ReadonlyArray<Input>, monitor?: Monitor): Promise<BN> =>
    this.getMonitor(monitor).captureSpanLog(
      async () => {
        const spentCoins = await Promise.all(claims.map(async (claim) => this.tryGetSpentCoin(claim)));

        const filteredSpentCoins = spentCoins.filter(commonUtils.notNull);
        if (spentCoins.length !== filteredSpentCoins.length) {
          throw new CoinUnspentError();
        }

        if (filteredSpentCoins.some((coin) => coin.claimed)) {
          throw new CoinClaimedError();
        }

        if (
          filteredSpentCoins.some((coin) => !common.uInt256Equal(coin.output.asset, this.settings.governingToken.hash))
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
            const header = await this.header.get({
              hashOrIndex: index,
            });

            const blockData = await this.blockData.get({
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

  private async persistBlocksAsync(): Promise<void> {
    if (this.mutablePersistingBlocks || !this.mutableRunning) {
      return;
    }

    this.mutablePersistingBlocks = true;
    let entry: Entry | undefined;
    try {
      this.cleanBlockQueue();
      entry = this.peekBlockQueue();

      const isForkedBlock =
        entry !== undefined &&
        entry.block.index === this.currentBlockIndex &&
        this.mutableCurrentBlock !== undefined &&
        !common.uInt256Equal(entry.block.hash, this.mutableCurrentBlock.hash);
      // tslint:disable-next-line no-loop-statement
      while (
        this.mutableRunning &&
        entry !== undefined &&
        ((entry.block.index === this.currentBlockIndex + 1 &&
          (this.mutableCurrentBlock === undefined ||
            common.uInt256Equal(entry.block.previousHash, this.mutableCurrentBlock.hash))) ||
          isForkedBlock)
      ) {
        entry = this.mutableBlockQueue.dequeue();
        const entryNonNull = entry;
        if (isForkedBlock) {
          [this.mutableCurrentBlock, this.mutablePreviousBlock] = await Promise.all([
            this.block.tryGet({ hashOrIndex: entryNonNull.block.index - 1 }),
            this.block.tryGet({ hashOrIndex: entryNonNull.block.index - 2 }),
          ]);
          this.mutableCurrentHeader =
            this.mutableCurrentBlock === undefined ? undefined : this.mutableCurrentBlock.header;
          this.mutableWriteBlockchain = undefined;
          this.mutableWriteBlockchain = this.createWriteBlockchain();
        }

        await entry.monitor
          .withData({ [labels.NEO_BLOCK_INDEX]: entry.block.index })
          .captureSpanLog(async (span) => this.persistBlockInternal(span, entryNonNull.block, entryNonNull.unsafe), {
            name: 'neo_blockchain_persist_block_top_level',
            level: { log: 'verbose', span: 'info' },
            metric: {
              total: NEO_BLOCKCHAIN_PERSIST_BLOCK_DURATION_SECONDS,
              error: NEO_BLOCKCHAIN_PERSIST_BLOCK_FAILURES_TOTAL,
            },

            trace: true,
          });

        entry.resolve();
        this.mutableBlock$.next(entry.block);
        NEO_BLOCKCHAIN_BLOCK_INDEX_GAUGE.set(entry.block.index);
        NEO_BLOCKCHAIN_PERSIST_BLOCK_LATENCY_SECONDS.observe(this.monitor.nowSeconds() - entry.block.timestamp);

        this.cleanBlockQueue();
        entry = this.peekBlockQueue();
      }
    } catch (error) {
      if (entry !== undefined) {
        entry.reject(error);
      }
    } finally {
      this.mutablePersistingBlocks = false;
      if (this.mutableDoneRunningResolve !== undefined) {
        this.mutableDoneRunningResolve();
        this.mutableDoneRunningResolve = undefined;
      }
    }
  }

  private cleanBlockQueue(): void {
    let entry = this.peekBlockQueue();
    // tslint:disable-next-line no-loop-statement
    while (entry !== undefined && entry.block.index <= this.currentBlockIndex) {
      if (
        entry.block.index !== this.currentBlockIndex ||
        this.mutableCurrentBlock === undefined ||
        common.uInt256Equal(entry.block.hash, this.mutableCurrentBlock.hash)
      ) {
        this.mutableBlockQueue.dequeue();
        entry.resolve();
        entry = this.peekBlockQueue();
      }
    }
  }

  private peekBlockQueue(): Entry | undefined {
    if (this.mutableBlockQueue.length > 0) {
      return this.mutableBlockQueue.peek();
    }

    return undefined;
  }

  private readonly verifyScript = async (
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

    const blockchain = this.createWriteBlockchain();
    const result = await this.vm.executeScripts({
      monitor: this.getMonitor(monitor),
      scripts: [{ code: witness.invocation, pushOnly: true }, { code: verification }],

      blockchain,
      scriptContainer,
      triggerType: TriggerType.Verification,
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

  private readonly tryGetInvocationData = async (
    transaction: InvocationTransaction,
  ): Promise<SerializableInvocationData | undefined> => {
    const data = await this.invocationData.tryGet({
      hash: transaction.hash,
    });

    if (data === undefined) {
      return undefined;
    }

    const [asset, contracts, actions] = await Promise.all([
      data.assetHash === undefined ? Promise.resolve(undefined) : this.asset.get({ hash: data.assetHash }),
      Promise.all(data.contractHashes.map(async (contractHash) => this.contract.tryGet({ hash: contractHash }))),
      data.actionIndexStart.eq(data.actionIndexStop)
        ? Promise.resolve([])
        : this.action
            .getAll$({
              indexStart: data.actionIndexStart,
              indexStop: data.actionIndexStop.sub(utils.ONE),
            })
            .pipe(toArray())
            .toPromise(),
    ]);

    return {
      asset,
      contracts: contracts.filter(commonUtils.notNull),
      deletedContractHashes: data.deletedContractHashes,
      migratedContractHashes: data.migratedContractHashes,
      voteUpdates: data.voteUpdates,
      result: data.result,
      actions,
    };
  };
  private readonly tryGetTransactionData = async (transaction: TransactionBase): Promise<TransactionData | undefined> =>
    this.transactionData.tryGet({ hash: transaction.hash });
  private readonly getUnclaimed = async (hash: UInt160): Promise<ReadonlyArray<Input>> =>
    this.accountUnclaimed
      .getAll$({ hash })
      .pipe(toArray())
      .toPromise()
      .then((values) => values.map((value) => value.input));
  private readonly getUnspent = async (hash: UInt160): Promise<ReadonlyArray<Input>> => {
    const unspent = await this.accountUnspent
      .getAll$({ hash })
      .pipe(toArray())
      .toPromise();

    return unspent.map((value) => value.input);
  };
  private readonly getAllValidators = async (): Promise<ReadonlyArray<Validator>> =>
    this.validator.all$.pipe(toArray()).toPromise();
  private readonly isSpent = async (input: OutputKey): Promise<boolean> => {
    const transactionData = await this.transactionData.tryGet({
      hash: input.hash,
    });

    return (
      transactionData !== undefined && (transactionData.endHeights[input.index] as number | undefined) !== undefined
    );
  };
  private readonly tryGetSpentCoin = async (input: Input): Promise<SpentCoin | undefined> => {
    const [transactionData, output] = await Promise.all([
      this.transactionData.tryGet({ hash: input.hash }),
      this.output.get(input),
    ]);

    if (transactionData === undefined) {
      return undefined;
    }

    const endHeight = transactionData.endHeights[input.index] as number | undefined;
    if (endHeight === undefined) {
      return undefined;
    }

    const claimed = transactionData.claimed[input.index];

    return {
      output,
      startHeight: transactionData.startHeight,
      endHeight,
      claimed: !!claimed,
    };
  };

  private start(): void {
    this.mutableBlock$ = new Subject();
    this.mutablePersistingBlocks = false;
    this.mutableBlockQueue = new PriorityQueue({
      comparator: (a, b) => a.block.index - b.block.index,
    });

    this.mutableInQueue = new Set();
    this.mutableDoneRunningResolve = undefined;
    this.mutableRunning = true;
    this.monitor.log({ name: 'neo_blockchain_start' });
  }

  // private readonly getVotes = async (transactions: ReadonlyArray<Transaction>): Promise<ReadonlyArray<Vote>> => {
  //   const inputs = await Promise.all(
  //     transactions.map(async (transaction) =>
  //       transaction.getReferences({
  //         getOutput: this.output.get,
  //       }),
  //     ),
  //   ).then((results) =>
  //     results.reduce((acc, inputResults) => acc.concat(inputResults), []).map((output) => ({
  //       address: output.address,
  //       asset: output.asset,
  //       value: output.value.neg(),
  //     })),
  //   );

  //   const outputs = transactions
  //     .reduce<ReadonlyArray<Output>>((acc, transaction) => acc.concat(transaction.outputs), [])
  //     .map((output) => ({
  //       address: output.address,
  //       asset: output.asset,
  //       value: output.value,
  //     }));

  //   const changes = _.fromPairs(
  //     Object.entries(
  //       _.groupBy(
  //         inputs
  //           .concat(outputs)
  //           .filter((output) => common.uInt256Equal(output.asset, this.settings.governingToken.hash)),

  //         (output) => common.uInt160ToHex(output.address),
  //       ),
  //     ).map(([addressHex, addressOutputs]) => [
  //       addressHex,
  //       addressOutputs.reduce((acc, output) => acc.add(output.value), utils.ZERO),
  //     ]),
  //   );

  //   const votes = await this.account.all$
  //     .pipe(
  //       filter((account) => account.votes.length > 0),
  //       map((account) => {
  //         let balance = account.balances[this.settings.governingToken.hashHex];
  //         balance = balance === undefined ? utils.ZERO : balance;
  //         const change = changes[account.hashHex];
  //         balance = balance.add(change === undefined ? utils.ZERO : change);

  //         return balance.lte(utils.ZERO)
  //           ? undefined
  //           : {
  //               publicKeys: account.votes,
  //               count: balance,
  //             };
  //       }),
  //       toArray(),
  //     )
  //     .toPromise();
  //   if (votes.length === 0) {
  //     return [
  //       {
  //         publicKeys: this.settings.standbyValidators,
  //         count: this.settings.governingToken.asset.amount,
  //       },
  //     ];
  //   }

  //   return votes.filter(commonUtils.notNull);
  // };

  private async persistBlockInternal(monitor: Monitor, block: Block, unsafe?: boolean): Promise<void> {
    NEO_BLOCKCHAIN_PERSISTING_BLOCK_INDEX_GAUGE.set(block.index);
    if (!unsafe) {
      await this.verifyBlock(block, monitor);
    }

    const blockchain = this.createWriteBlockchain();

    await blockchain.persistBlock(monitor, block);

    const writeBlockchain = this.mutableWriteBlockchain;
    if (writeBlockchain === undefined) {
      throw new Error('Something went wrong');
    }
    await monitor.captureSpan(async () => this.storage.commit(writeBlockchain.getChangeSet()), {
      name: 'neo_blockchain_persist_block_commit_storage',
    });

    blockchain.setStorage(this.storage);
    this.mutableWriteBlockchain = blockchain;
    this.mutablePreviousBlock = this.mutableCurrentBlock;
    this.mutableCurrentBlock = block;
    this.mutableCurrentHeader = block.header;
  }

  private createWriteBlockchain(): WriteBatchBlockchain {
    return new WriteBatchBlockchain({
      settings: this.settings,
      currentBlock: this.mutableCurrentBlock,
      currentHeader: this.mutableCurrentHeader,
      storage: this.mutableWriteBlockchain === undefined ? this.storage : this.mutableWriteBlockchain,
      vm: this.vm,
      getValidators: this.getValidators,
    });
  }

  private getMonitor(monitor?: Monitor): Monitor {
    if (monitor === undefined) {
      return this.monitor;
    }

    return monitor.at(NAMESPACE);
  }
}
