import {
  CallFlags,
  common,
  crypto,
  ECPoint,
  ScriptBuilder,
  TriggerType,
  UInt160,
  UInt256,
  VerifyResultModel,
  VerifyResultModelExtended,
} from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  Action,
  ActionSource,
  ApplicationExecuted,
  ApplicationLog,
  Block,
  Blockchain as BlockchainType,
  BlockchainSettings,
  BlockData,
  CallReceipt,
  ChangeSet,
  DeserializeWireContext,
  DesignationRole,
  Execution,
  ExtensiblePayload,
  Header,
  LogAction,
  Mempool,
  NativeContainer,
  Nep17Balance,
  Notification,
  NotificationAction,
  RunEngineOptions,
  RunEngineResult,
  SerializableBlockData,
  SerializableTransactionData,
  SerializeJSONContext,
  Signers,
  Storage,
  Transaction,
  TransactionData,
  TransactionState,
  TransactionVerificationContext,
  VerifyOptions,
  VM,
  VMProtocolSettingsIn,
  Witness,
} from '@neo-one/node-core';
import { Labels, utils as neoOneUtils } from '@neo-one/utils';
import { BN } from 'bn.js';
import PriorityQueue from 'js-priority-queue';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, toArray } from 'rxjs/operators';
import { BlockVerifyError, ConsensusPayloadVerifyError, GenesisBlockNotRegisteredError } from './errors';
import { getExecutionResult } from './getExecutionResult';
import { getNep17UpdateOptions } from './getNep17UpdateOptions';
import { HeaderCache } from './HeaderCache';
import { ImmutableHashSet, ImmutableHashSetBuilder } from './ImmutableHashSet';
import { PersistingBlockchain } from './PersistingBlockchain';
import { utils } from './utils';
import { verifyWitness, verifyWitnesses } from './verify';

const logger = createChild(nodeLogger, { service: 'blockchain' });

export interface CreateBlockchainOptions {
  readonly onPersistNativeContractScript?: Buffer;
  readonly postPersistNativeContractScript?: Buffer;
  readonly settings: BlockchainSettings;
  readonly storage: Storage;
  readonly native: NativeContainer;
  readonly vm: VM;
  readonly onPersist?: () => void | Promise<void>;
}

export interface BlockchainOptions extends CreateBlockchainOptions {
  readonly currentBlock?: Block;
  readonly previousBlock?: Block;
}

interface Entry {
  readonly block: Block;
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
  readonly verify: boolean;
}

export class Blockchain {
  public get currentBlock(): Block {
    if (this.mutableCurrentBlock === undefined) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this.mutableCurrentBlock;
  }

  public get previousBlock(): Block | undefined {
    return this.mutablePreviousBlock;
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

  public get verifyOptions(): VerifyOptions {
    return {
      vm: this.vm,
      storage: this.storage,
      native: this.native,
      headerCache: this.headerCache,
      verifyWitnesses: this.verifyWitnesses,
      verifyWitness: this.verifyWitness,
      height: this.currentBlockIndex,
      extensibleWitnessWhiteList: this.mutableExtensibleWitnessWhiteList,
      settings: this.protocolSettings,
    };
  }

  public get protocolSettings(): VMProtocolSettingsIn {
    const {
      network,
      addressVersion,
      standbyCommittee,
      committeeMembersCount,
      validatorsCount,
      millisecondsPerBlock,
      memoryPoolMaxTransactions,
      maxTransactionsPerBlock,
      maxTraceableBlocks,
      initialGasDistribution,
      nativeUpdateHistory,
    } = this.settings;

    return {
      network,
      addressVersion,
      standbyCommittee: standbyCommittee.map((ecp) => common.ecPointToString(ecp)),
      committeeMembersCount,
      validatorsCount,
      millisecondsPerBlock,
      memoryPoolMaxTransactions,
      maxTransactionsPerBlock,
      maxTraceableBlocks,
      initialGasDistribution: initialGasDistribution.toString(),
      nativeUpdateHistory,
    };
  }

  public get settings(): BlockchainSettings {
    return {
      ...this.settingsInternal$.getValue(),
      standbyCommittee: this.mutableStandbyCommittee,
      committeeMembersCount: this.mutableStandbyCommittee.length,
    };
  }

  public get nep17Balances() {
    return this.storage.nep17Balances;
  }

  public get nep17TransfersReceived() {
    return this.storage.nep17TransfersReceived;
  }

  public get nep17TransfersSent() {
    return this.storage.nep17TransfersSent;
  }

  public get applicationLogs() {
    return this.storage.applicationLogs;
  }

  public get storages() {
    return this.storage.storages;
  }

  public get blockData() {
    return this.storage.blockData;
  }

  public get transactionData() {
    return this.storage.transactionData;
  }

  public get action() {
    return this.storage.action;
  }

  public get serializeJSONContext(): SerializeJSONContext {
    return {
      addressVersion: this.settings.addressVersion,
      network: this.settings.network,
      tryGetTransactionData: this.tryGetTransactionData,
      tryGetBlockData: this.tryGetBlockData,
    };
  }

  public static async create({
    settings,
    storage,
    native,
    vm,
    onPersist,
  }: CreateBlockchainOptions): Promise<BlockchainType> {
    let currentBlock;
    const getInitialized = async () => native.Ledger.isInitialized(storage);
    if (await getInitialized()) {
      const currentIndex = await native.Ledger.currentIndex(storage);
      currentBlock = await native.Ledger.getBlock(storage, currentIndex);
    }

    const blockchain = new Blockchain({
      settings,
      storage,
      native,
      vm,
      onPersist,
      currentBlock,
    });

    if (!(await getInitialized())) {
      await blockchain.persistBlock({ block: settings.genesisBlock });
    }

    return blockchain;
  }

  public readonly deserializeWireContext: DeserializeWireContext;

  public readonly verifyWitness = verifyWitness;
  public readonly verifyWitnesses = verifyWitnesses;
  public readonly onPersistNativeContractScript: Buffer;
  public readonly postPersistNativeContractScript: Buffer;
  public readonly headerCache = new HeaderCache();

  private readonly settingsInternal$: BehaviorSubject<BlockchainSettings>;
  private readonly storage: Storage;
  private readonly native: NativeContainer;
  private readonly vm: VM;
  private readonly onPersist: () => void | Promise<void>;

  private mutableStandbyCommittee: readonly ECPoint[];
  private mutableBlockQueue: PriorityQueue<Entry> = new PriorityQueue({
    comparator: (a, b) => a.block.index - b.block.index,
  });
  private mutableCurrentBlock: Block | undefined;
  private mutablePreviousBlock: Block | undefined;
  private mutableExtensibleWitnessWhiteList: ImmutableHashSet<UInt160>;
  private mutablePersistingBlocks = false;
  private mutableInQueue: Set<string> = new Set();
  private mutableRunning = false;
  private mutableDoneRunningResolve: (() => void) | undefined;
  private mutableBlock$: Subject<Block> = new Subject();

  public constructor(options: BlockchainOptions) {
    this.settingsInternal$ = new BehaviorSubject(options.settings);
    this.mutableStandbyCommittee = options.settings.standbyCommittee;
    this.storage = options.storage;
    this.native = options.native;
    this.vm = options.vm;
    this.onPersistNativeContractScript =
      options.onPersistNativeContractScript ?? utils.getOnPersistNativeContractScript();
    this.postPersistNativeContractScript =
      options.postPersistNativeContractScript ?? utils.getPostPersistNativeContractScript();
    this.deserializeWireContext = {
      network: this.settings.network,
      validatorsCount: this.settings.validatorsCount,
      maxValidUntilBlockIncrement: this.settings.maxValidUntilBlockIncrement,
    };
    this.mutableCurrentBlock = options.currentBlock;
    this.mutablePreviousBlock = options.previousBlock;
    this.mutableExtensibleWitnessWhiteList = new ImmutableHashSetBuilder<UInt160>().toImmutable();
    this.onPersist = options.onPersist === undefined ? () => this.vm.updateSnapshots() : options.onPersist;
    this.start();
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

    logger.info({ name: 'neo_blockchain_stop' }, 'Neo blockchain stopped.');
  }

  public async reset(): Promise<void> {
    await this.stop();
    await this.storage.reset();
    this.mutableCurrentBlock = undefined;
    this.mutablePreviousBlock = undefined;
    this.start();
    await this.persistBlock({ block: this.settings.genesisBlock });
  }

  public async verifyBlock(block: Block): Promise<void> {
    const verification = await block.verify(this.verifyOptions);
    if (!verification) {
      throw new BlockVerifyError(block.hashHex);
    }
  }

  public async verifyTransaction(
    transaction: Transaction,
    mempool: Mempool,
    context?: TransactionVerificationContext,
  ): Promise<VerifyResultModelExtended> {
    const containsTransaction = await this.containsTransactionInternal(transaction.hash, mempool);
    if (containsTransaction) {
      return {
        verifyResult: VerifyResultModel.AlreadyExists,
        failureReason: `Transaction already exists in node mempool or storage.`,
      };
    }

    return transaction.verify(this.verifyOptions, context);
  }

  public async verifyConsensusPayload(payload: ExtensiblePayload) {
    this.mutableExtensibleWitnessWhiteList = await this.updateExtensibleWitnessWhiteList(this.storage);
    const verification = await payload.verify(this.verifyOptions);
    if (!verification) {
      throw new ConsensusPayloadVerifyError(payload.hashHex);
    }
  }

  public async getCurrentIndex() {
    return this.native.Ledger.currentIndex(this.storage);
  }

  public async getCurrentHash() {
    return this.native.Ledger.currentHash(this.storage);
  }

  public async getCurrentBlock() {
    return this.native.Ledger.getBlock(this.storage, await this.getCurrentHash());
  }

  public async getBlock(hashOrIndex: UInt256 | number): Promise<Block | undefined> {
    const hashPromise = typeof hashOrIndex === 'number' ? this.getBlockHash(hashOrIndex) : Promise.resolve(hashOrIndex);
    const hash = await hashPromise;
    if (hash === undefined) {
      return undefined;
    }

    if (this.currentBlock.hash.equals(hash)) {
      return this.currentBlock;
    }

    if (this.previousBlock?.hash.equals(hash)) {
      return this.previousBlock;
    }

    return this.native.Ledger.getBlock(this.storage, hash);
  }

  public async getTrimmedBlock(hash: UInt256) {
    return this.native.Ledger.getTrimmedBlock(this.storage, hash);
  }

  public async getBlockHash(index: number): Promise<UInt256 | undefined> {
    return this.native.Ledger.getBlockHash(this.storage, index);
  }

  public async getHeader(hashOrIndex: UInt256 | number): Promise<Header | undefined> {
    return this.native.Ledger.getHeader(this.storage, hashOrIndex);
  }

  public async getTransaction(hash: UInt256): Promise<TransactionState | undefined> {
    return this.native.Ledger.getTransactionState(this.storage, hash);
  }

  public async containsTransaction(hash: UInt256): Promise<boolean> {
    return this.native.Ledger.containsTransaction(this.storage, hash);
  }

  public async getNextBlockHash(hash: UInt256): Promise<UInt256 | undefined> {
    const header = await this.getHeader(hash);
    if (header === undefined) {
      return undefined;
    }

    return this.getBlockHash(header.index + 1);
  }

  public async getValidators(): Promise<readonly ECPoint[]> {
    return this.native.NEO.computeNextBlockValidators(this.storage);
  }

  public async getNextBlockValidators(): Promise<readonly ECPoint[]> {
    return this.native.NEO.getNextBlockValidators(this.storage);
  }

  public async getFeePerByte(): Promise<BN> {
    return this.native.Policy.getFeePerByte(this.storage);
  }

  public shouldRefreshCommittee(offset = 0): boolean {
    return (this.currentBlockIndex + offset) % this.settings.committeeMembersCount === 0;
  }

  public async persistBlock({
    block,
    verify = false,
  }: {
    readonly block: Block;
    readonly verify?: boolean;
  }): Promise<void> {
    // tslint:disable-next-line promise-must-complete
    return new Promise<void>((resolve, reject) => {
      if (this.mutableInQueue.has(block.hashHex)) {
        resolve();

        return;
      }
      this.mutableInQueue.add(block.hashHex);
      this.mutableBlockQueue.queue({
        block,
        resolve,
        reject,
        verify,
      });

      // tslint:disable-next-line no-floating-promises
      this.persistBlocksAsync();
    });
  }

  public async getVerificationCost(contractHash: UInt160, transaction: Transaction) {
    const contract = await this.native.ContractManagement.getContract(this.storage, contractHash);
    if (contract === undefined) {
      return { fee: utils.ZERO, size: 0 };
    }

    return utils.verifyContract({ contract, vm: this.vm, transaction, protocolSettings: this.protocolSettings });
  }

  public testTransaction(transaction: Transaction): CallReceipt {
    return this.parseRunEngineResult(
      this.runEngineWrapper({
        script: transaction.script,
        snapshot: 'clone',
        container: transaction,
        gas: common.ONE_HUNDRED_FIXED8,
      }),
    );
  }

  public invokeScript({
    script,
    signers,
    gas,
    rvcount,
  }: {
    readonly script: Buffer;
    readonly signers?: Signers;
    readonly gas?: BN;
    readonly rvcount?: number;
  }): CallReceipt {
    return this.parseRunEngineResult(
      this.runEngineWrapper({
        script,
        snapshot: 'main',
        container: signers,
        gas,
        rvcount,
      }),
    );
  }

  public updateSettings(settings: BlockchainSettings): void {
    this.settingsInternal$.next(settings);
  }

  private parseRunEngineResult(result: RunEngineResult): CallReceipt {
    let globalActionIndex = new BN(0);
    const actions: Action[] = [];

    result.notifications.forEach((notification) => {
      // tslint:disable-next-line: no-array-mutation
      actions.push(
        new NotificationAction({
          index: globalActionIndex,
          scriptHash: notification.scriptHash,
          eventName: notification.eventName,
          args: notification.state.map((n) => n.toContractParameter()),
          source: ActionSource.Transaction,
        }),
      );

      globalActionIndex = globalActionIndex.add(utils.ONE);
    });
    result.logs.forEach((log) => {
      // tslint:disable-next-line: no-array-mutation
      actions.push(
        new LogAction({
          index: globalActionIndex,
          scriptHash: log.callingScriptHash,
          message: log.message,
          position: log.position,
          source: ActionSource.Transaction,
        }),
      );

      globalActionIndex = globalActionIndex.add(utils.ONE);
    });

    const executionResult = getExecutionResult(result);

    return {
      result: executionResult,
      actions,
    };
  }

  private readonly tryGetBlockData = async (hash: UInt256): Promise<SerializableBlockData | undefined> => {
    const blockData = await this.blockData.tryGet({ hash });

    if (blockData === undefined) {
      return undefined;
    }

    const count = blockData.blockActionsCount;
    const lookupStart = blockData.lastGlobalActionIndex.subn(count - 1).toArrayLike(Buffer, 'be', 8);
    const lookupEnd = blockData.lastGlobalActionIndex.toArrayLike(Buffer, 'be', 8);

    const blockActions = await (count === 0
      ? Promise.resolve([])
      : this.action
          .find$(lookupStart, lookupEnd)
          .pipe(
            map(({ value }) => value),
            toArray(),
          )
          .toPromise());

    return {
      blockActions,
    };
  };

  private readonly tryGetTransactionData = async (hash: UInt256): Promise<SerializableTransactionData | undefined> => {
    const data = await this.transactionData.tryGet({ hash });

    if (data === undefined) {
      return undefined;
    }

    const tryGetContract = async (hashIn: UInt160) => {
      const contract = await this.native.ContractManagement.getContract(this.storage, hashIn);
      if (contract === undefined) {
        logger.error({
          title: 'blockchain_get_transaction_data_contract_not_found',
          hash: common.uInt160ToString(hashIn),
        });
      }

      return contract;
    };

    const [deployedContracts, updatedContracts, actions] = await Promise.all([
      Promise.all(data.deployedContractHashes.map(tryGetContract)),
      Promise.all(data.updatedContractHashes.map(tryGetContract)),
      data.actionIndexStart.eq(data.actionIndexStop)
        ? Promise.resolve([])
        : this.action
            .find$(
              data.actionIndexStart.toArrayLike(Buffer, 'be', 8),
              data.actionIndexStop.sub(utils.ONE).toArrayLike(Buffer, 'be', 8),
            )
            .pipe(
              map(({ value }) => value),
              toArray(),
            )
            .toPromise(),
    ]);

    return {
      ...data,
      deployedContracts: deployedContracts.filter(neoOneUtils.notNull),
      updatedContracts: updatedContracts.filter(neoOneUtils.notNull),
      actions,
    };
  };

  private async updateExtensibleWitnessWhiteList(storage: Storage) {
    const currentHeight = await this.native.Ledger.currentIndex(storage);
    const builder = new ImmutableHashSetBuilder<UInt160>();
    builder.add(await this.native.NEO.getCommitteeAddress(storage));
    const validators = await this.native.NEO.getNextBlockValidators(storage);
    builder.add(crypto.getBFTAddress(validators));
    builder.unionWith(validators.map((val) => crypto.toScriptHash(crypto.createSignatureRedeemScript(val))));
    const stateValidators = await this.native.RoleManagement.getDesignatedByRole(
      storage,
      DesignationRole.StateValidator,
      this.native.Ledger,
      currentHeight,
    );
    if (stateValidators.length > 0) {
      builder.add(crypto.getBFTAddress(stateValidators));
      builder.unionWith(stateValidators.map((val) => crypto.toScriptHash(crypto.createSignatureRedeemScript(val))));
    }

    return builder.toImmutable();
  }

  private runEngineWrapper({
    script,
    snapshot,
    container,
    persistingBlock: blockIn,
    rvcount,
    offset = 0,
    gas = common.TEN_FIXED8,
  }: RunEngineOptions): RunEngineResult {
    let persistingBlock = blockIn;
    if (persistingBlock === undefined) {
      persistingBlock = this.createDummyBlock();
    }

    return this.vm.withApplicationEngine(
      {
        trigger: TriggerType.Application,
        container,
        snapshot,
        gas,
        persistingBlock,
        settings: this.protocolSettings,
      },
      (engine) => {
        engine.loadScript({ script, initialPosition: offset, rvcount });
        engine.execute();

        return utils.getRunEngineResult(engine, container);
      },
    );
  }

  private async containsTransactionInternal(hash: UInt256, mempool: Mempool) {
    const hashHex = common.uInt256ToHex(hash);
    if (mempool[hashHex] !== undefined) {
      return true;
    }

    return this.native.Ledger.containsTransaction(this.storage, hash);
  }

  private async persistBlocksAsync(): Promise<void> {
    if (this.mutablePersistingBlocks || !this.mutableRunning) {
      return;
    }

    this.mutablePersistingBlocks = true;
    let entry: Entry | undefined;
    try {
      entry = this.cleanBlockQueue();

      // tslint:disable-next-line no-loop-statement
      while (this.mutableRunning && entry !== undefined && entry.block.index === this.currentBlockIndex + 1) {
        const entryNonNull = entry;
        const logData = {
          [Labels.NEO_BLOCK_INDEX]: entry.block.index,
          name: 'neo_blockchain_persist_block_top_level',
        };
        try {
          await this.persistBlockInternal(entryNonNull.block, entryNonNull.verify);
        } catch (err) {
          logger.error({ err, ...logData });

          throw err;
        }

        entry.resolve();
        this.mutableBlock$.next(entry.block);
        entry = this.cleanBlockQueue();
      }

      if (entry !== undefined) {
        this.mutableBlockQueue.queue(entry);
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

  private cleanBlockQueue(): Entry | undefined {
    let entry = this.dequeueBlockQueue();
    // tslint:disable-next-line no-loop-statement
    while (entry !== undefined && entry.block.index <= this.currentBlockIndex) {
      entry.resolve();
      entry = this.dequeueBlockQueue();
    }

    return entry;
  }

  private dequeueBlockQueue(): Entry | undefined {
    if (this.mutableBlockQueue.length > 0) {
      return this.mutableBlockQueue.dequeue();
    }

    return undefined;
  }

  private start(): void {
    this.mutableBlock$ = new Subject();
    this.mutablePersistingBlocks = false;
    this.mutableBlockQueue = new PriorityQueue({
      comparator: (a, b) => a.block.index - b.block.index,
    });

    this.mutableInQueue = new Set();
    this.mutableDoneRunningResolve = undefined;
    this.mutableRunning = true;
    logger.info(
      { name: 'neo_blockchain_start', [Labels.NEO_BLOCK_INDEX]: this.currentBlockIndex },
      'Neo blockchain started.',
    );
  }

  private updateBlockMetadata(block: Block): void {
    this.mutablePreviousBlock = this.mutableCurrentBlock;
    this.mutableCurrentBlock = block;
  }

  private updateNep17Balances({
    applicationsExecuted,
    block,
  }: {
    readonly applicationsExecuted: readonly ApplicationExecuted[];
    readonly block: Block;
  }): ChangeSet {
    const { assetKeys, transfersSent, transfersReceived } = getNep17UpdateOptions({
      applicationsExecuted,
      block,
    });

    const nep17BalancePairs = assetKeys.map((key) => {
      const script = new ScriptBuilder()
        .emitDynamicAppCall(key.assetScriptHash, 'balanceOf', CallFlags.All, key.userScriptHash)
        .build();
      const callReceipt = this.invokeScript({ script });
      const balanceBuffer = callReceipt.result.stack[0].asBuffer(true);

      return { key, value: new Nep17Balance({ balanceBuffer, lastUpdatedBlock: this.currentBlockIndex }) };
    });

    const nep17BalanceChangeSet: ChangeSet = nep17BalancePairs.map(({ key, value }) => {
      if (value.balance.eqn(0)) {
        return {
          type: 'delete',
          change: {
            type: 'nep17Balance',
            key,
          },
        };
      }

      return {
        type: 'add',
        change: {
          type: 'nep17Balance',
          key,
          value,
        },
        subType: 'update',
      };
    });

    const nep17TransfersSentChangeSet: ChangeSet = transfersSent.map(({ key, value }) => ({
      type: 'add',
      subType: 'add',
      change: {
        type: 'nep17TransferSent',
        key,
        value,
      },
    }));

    const nep17TransfersReceivedChangeSet: ChangeSet = transfersReceived.map(({ key, value }) => ({
      type: 'add',
      subType: 'add',
      change: {
        type: 'nep17TransferReceived',
        key,
        value,
      },
    }));

    return nep17BalanceChangeSet.concat(nep17TransfersReceivedChangeSet, nep17TransfersSentChangeSet);
  }

  private updateBlockLog({
    applicationsExecuted,
    block,
  }: {
    readonly applicationsExecuted: readonly ApplicationExecuted[];
    readonly block: Block;
  }): ChangeSet {
    const executions = applicationsExecuted
      .filter(({ transaction }) => transaction === undefined)
      .map(
        ({ trigger, state: vmState, gasConsumed, stack, notifications: notificationsIn, exception }) =>
          new Execution({
            vmState,
            trigger,
            exception,
            gasConsumed,
            stack,
            notifications: notificationsIn.map(
              ({ scriptHash, eventName, state }) =>
                new Notification({
                  scriptHash,
                  eventName,
                  state,
                }),
            ),
          }),
      );

    const value = new ApplicationLog({
      blockHash: block.hash,
      executions,
    });

    return [
      {
        type: 'add',
        subType: 'add',
        change: {
          type: 'applicationLog',
          key: block.hash,
          value,
        },
      },
    ];
  }

  private updateApplicationLogs({
    applicationsExecuted,
  }: {
    readonly applicationsExecuted: readonly ApplicationExecuted[];
  }): ChangeSet {
    return applicationsExecuted
      .filter(({ transaction }) => neoOneUtils.notNull(transaction))
      .map(
        ({
          transaction: txIn,
          trigger,
          state: vmState,
          gasConsumed,
          stack,
          notifications: notificationsIn,
          exception,
        }) => {
          const transaction = txIn as Transaction;
          const notifications = notificationsIn.map(
            ({ scriptHash, eventName, state }) =>
              new Notification({
                scriptHash,
                eventName,
                state,
              }),
          );

          const executions = [
            new Execution({
              vmState,
              trigger,
              exception,
              gasConsumed,
              stack,
              notifications,
            }),
          ];

          const value = new ApplicationLog({
            txid: transaction.hash,
            executions,
          });

          return {
            type: 'add',
            subType: 'add',
            change: {
              type: 'applicationLog',
              key: transaction.hash,
              value,
            },
          };
        },
      );
  }

  private getBlockDataUpdates({
    block,
    lastGlobalActionIndex,
    prevBlockData,
    blockActionsCount,
  }: {
    readonly block: Block;
    readonly lastGlobalActionIndex: BN;
    readonly blockActionsCount: number;
    readonly prevBlockData: { readonly lastGlobalActionIndex: BN; readonly lastGlobalTransactionIndex: BN };
  }): ChangeSet {
    return [
      {
        type: 'add',
        subType: 'add',
        change: {
          type: 'blockData',
          key: { hash: block.hash },
          value: new BlockData({
            hash: block.hash,
            lastGlobalActionIndex,
            lastGlobalTransactionIndex: prevBlockData.lastGlobalTransactionIndex.add(new BN(block.transactions.length)),
            blockActionsCount,
          }),
        },
      },
    ];
  }

  private getTransactionDataChangeSet(transactionData: readonly TransactionData[]): ChangeSet {
    return transactionData.map((txData) => ({
      type: 'add',
      subType: 'add',
      change: {
        type: 'transactionData',
        key: { hash: txData.hash },
        value: txData,
      },
    }));
  }

  private async getPrevBlockData(block: Block) {
    const maybePrevBlockData = await (block.index === 0
      ? Promise.resolve(undefined)
      : this.blockData.tryGet({ hash: block.previousHash }));

    return maybePrevBlockData === undefined
      ? {
          lastGlobalActionIndex: utils.NEGATIVE_ONE,
          lastGlobalTransactionIndex: utils.NEGATIVE_ONE,
        }
      : {
          lastGlobalActionIndex: maybePrevBlockData.lastGlobalActionIndex,
          lastGlobalTransactionIndex: maybePrevBlockData.lastGlobalTransactionIndex,
        };
  }

  private getActionUpdates(actions: readonly Action[]): ChangeSet {
    return actions.map((action) => ({
      type: 'add',
      subType: 'add',
      change: {
        type: 'action',
        key: { index: action.index },
        value: action,
      },
    }));
  }

  private async persistBlockInternal(block: Block, verify?: boolean): Promise<void> {
    if (verify) {
      await this.verifyBlock(block);
    }

    const blockchain = this.createPersistingBlockchain();
    const prevBlockData = await this.getPrevBlockData(block);

    const {
      changeBatch: persistBatch,
      transactionData,
      applicationsExecuted,
      actions,
      lastGlobalActionIndex,
      blockActionsCount,
    } = blockchain.persistBlock(block, prevBlockData.lastGlobalActionIndex, prevBlockData.lastGlobalTransactionIndex);
    const actionUpdates = this.getActionUpdates(actions);
    const transactionDataUpdates = this.getTransactionDataChangeSet(transactionData);
    const blockDataUpdates = this.getBlockDataUpdates({
      block,
      lastGlobalActionIndex,
      prevBlockData,
      blockActionsCount,
    });
    const applicationLogUpdates = this.updateApplicationLogs({ applicationsExecuted });
    const blockLogUpdate = this.updateBlockLog({ applicationsExecuted, block });
    const allUpdates: ChangeSet = [
      ...actionUpdates,
      ...transactionDataUpdates,
      ...blockDataUpdates,
      ...applicationLogUpdates,
      ...blockLogUpdate,
    ];

    await Promise.all([this.storage.commitBatch(persistBatch), this.storage.commit(allUpdates)]);

    const nep17Updates = this.updateNep17Balances({ applicationsExecuted, block });
    await this.storage.commit(nep17Updates);

    this.updateBlockMetadata(block);
    this.mutableExtensibleWitnessWhiteList = new ImmutableHashSetBuilder<UInt160>().toImmutable();

    await this.onPersist();

    const firstHeader = this.headerCache.tryRemoveFirst();
    if (firstHeader !== undefined && firstHeader.index !== block.index - 1) {
      logger.trace({
        name: 'neo_blockchain',
        message: `Header cache index does not match block index when persisting new block. Block index: ${block.index}. Headercache index: ${firstHeader.index}`,
      });
    }

    if (this.shouldRefreshCommittee()) {
      const newCommittee = await this.native.NEO.getCommittee(this.storage);
      this.mutableStandbyCommittee = newCommittee;
    }
  }

  private createPersistingBlockchain(): PersistingBlockchain {
    return new PersistingBlockchain({
      onPersistNativeContractScript: this.onPersistNativeContractScript,
      postPersistNativeContractScript: this.postPersistNativeContractScript,
      vm: this.vm,
      protocolSettings: this.protocolSettings,
    });
  }

  private createDummyBlock(): Block {
    return new Block({
      header: new Header({
        version: 0,
        previousHash: this.currentBlock.hash,
        timestamp: this.currentBlock.timestamp.addn(this.settings.millisecondsPerBlock),
        nonce: this.currentBlock.nonce,
        index: this.currentBlockIndex + 0,
        primaryIndex: 0,
        merkleRoot: common.ZERO_UINT256,
        nextConsensus: this.currentBlock.nextConsensus,
        witness: new Witness({
          invocation: Buffer.from([]),
          verification: Buffer.from([]),
        }),
        network: this.settings.network,
      }),
      transactions: [],
    });
  }
}
