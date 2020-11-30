import {
  common,
  ECPoint,
  ScriptBuilder,
  TriggerType,
  UInt160,
  UInt256,
  VerifyResultModel,
} from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  ApplicationExecuted,
  ApplicationLog,
  Block,
  Blockchain as BlockchainType,
  BlockchainSettings,
  CallReceipt,
  Change,
  ChangeSet,
  ConsensusData,
  ConsensusPayload,
  DeserializeWireContext,
  HashIndexState,
  Header,
  Mempool,
  NativeContainer,
  Nep5Balance,
  Notification,
  RunEngineOptions,
  Signers,
  Storage,
  Transaction,
  TransactionVerificationContext,
  VerifyConsensusPayloadOptions,
  VerifyOptions,
  VM,
  Witness,
} from '@neo-one/node-core';
import { Labels } from '@neo-one/utils';
import { BN } from 'bn.js';
import PriorityQueue from 'js-priority-queue';
import { Observable, Subject } from 'rxjs';
import { map, toArray } from 'rxjs/operators';
import {
  BlockVerifyError,
  ConsensusPayloadVerifyError,
  GenesisBlockNotRegisteredError,
  RecoverBlockchainError,
} from './errors';
import { getNep5UpdateOptions } from './getNep5UpdateOptions';
import { HeaderIndexCache } from './HeaderIndexCache';
import { PersistingBlockchain } from './PersistingBlockchain';
import { utils } from './utils';
import { verifyWitnesses } from './verify';
import { wrapExecuteScripts } from './wrapExecuteScripts';

const logger = createChild(nodeLogger, { service: 'blockchain' });

export interface CreateBlockchainOptions {
  readonly onPersistNativeContractScript?: Buffer;
  readonly settings: BlockchainSettings;
  readonly storage: Storage;
  readonly native: NativeContainer;
  readonly vm: VM;
}

export interface BlockchainOptions extends CreateBlockchainOptions {
  // tslint:disable-next-line: readonly-array
  readonly headerIndexCache: HeaderIndexCache;
  readonly currentBlock?: Block;
}

interface Entry {
  readonly block: Block;
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
  readonly verify: boolean;
}

export const recoverHeaderIndex = async (storage: Storage) => {
  const maybeHeaderHashIndex = await storage.headerHashIndex.tryGet();
  const initHeaderListIndex =
    maybeHeaderHashIndex === undefined ? 0 : Math.floor(maybeHeaderHashIndex.index / utils.hashListBatchSize);
  const storedHeaderCount = initHeaderListIndex * utils.hashListBatchSize;
  if (storedHeaderCount !== 0) {
    const { hashes: latestStoredHashes } = await storage.headerHashList.get(
      storedHeaderCount - utils.hashListBatchSize,
    );
    const hashIndex = await storage.headerHashIndex.get();
    let currentHashes: readonly UInt256[] = [];
    if (hashIndex.index >= storedHeaderCount) {
      let hash = hashIndex.hash;
      const finalHash = latestStoredHashes[latestStoredHashes.length - 1];
      // tslint:disable-next-line: no-loop-statement
      while (!hash.equals(finalHash)) {
        currentHashes = [hash].concat(currentHashes);
        const { previousHash } = await storage.blocks.get({ hashOrIndex: hash });
        hash = previousHash;
      }
    }

    return new HeaderIndexCache({
      storage,
      initStorageCount: storedHeaderCount,
      initCurrentHeaderHashes: currentHashes,
    });
  }

  const sortedTrimmedBlocks = await storage.blocks.all$
    .pipe(
      toArray(),
      map((blocks) => blocks.slice().sort(utils.blockComparator)),
    )
    .toPromise();

  return new HeaderIndexCache({
    storage,
    initStorageCount: 0,
    initCurrentHeaderHashes: sortedTrimmedBlocks.map((block) => block.hash),
  });
};
export class Blockchain {
  public static async create({ settings, storage, native, vm }: CreateBlockchainOptions): Promise<BlockchainType> {
    const headerIndexCache = await recoverHeaderIndex(storage);
    if (headerIndexCache.length > 0) {
      const currentHeaderHash = await headerIndexCache.get(headerIndexCache.length - 1);
      const currentBlockTrimmed = await storage.blocks.tryGet({ hashOrIndex: currentHeaderHash });
      if (currentBlockTrimmed === undefined) {
        throw new RecoverBlockchainError(headerIndexCache.length);
      }

      const currentBlock = await currentBlockTrimmed.getBlock(storage.transactions);

      return new Blockchain({
        headerIndexCache,
        settings,
        storage,
        native,
        vm,
        currentBlock,
      });
    }

    const blockchain = new Blockchain({
      headerIndexCache,
      settings,
      storage,
      native,
      vm,
    });

    await blockchain.persistBlock({ block: settings.genesisBlock });

    return blockchain;
  }

  public readonly deserializeWireContext: DeserializeWireContext;

  public readonly verifyWitnesses = verifyWitnesses;
  public readonly settings: BlockchainSettings;
  public readonly onPersistNativeContractScript: Buffer;

  // tslint:disable-next-line: readonly-array
  private readonly headerIndexCache: HeaderIndexCache;
  private readonly storage: Storage;
  private readonly native: NativeContainer;
  private readonly vm: VM;

  private mutableBlockQueue: PriorityQueue<Entry> = new PriorityQueue({
    comparator: (a, b) => a.block.index - b.block.index,
  });
  private mutableCurrentBlock: Block | undefined;
  private mutablePreviousBlock: Block | undefined;
  private mutableCurrentHeader: Header | undefined;
  private mutablePersistingBlocks = false;
  private mutableInQueue: Set<string> = new Set();
  private mutableRunning = false;
  private mutableDoneRunningResolve: (() => void) | undefined;
  private mutableBlock$: Subject<Block> = new Subject();

  public constructor(options: BlockchainOptions) {
    this.headerIndexCache = options.headerIndexCache;
    this.settings = options.settings;
    this.storage = options.storage;
    this.native = options.native;
    this.vm = options.vm;
    this.onPersistNativeContractScript =
      options.onPersistNativeContractScript ?? utils.getOnPersistNativeContractScript();
    this.deserializeWireContext = {
      messageMagic: this.settings.messageMagic,
      validatorsCount: this.settings.validatorsCount,
    };
    this.mutableCurrentBlock = options.currentBlock;
    this.start();
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

  public get currentBlockIndex(): number {
    return this.mutableCurrentBlock === undefined ? -1 : this.currentBlock.index;
  }

  public get currentHeaderIndex(): number {
    return this.headerIndexCache.length;
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
      verifyWitnesses: this.verifyWitnesses,
    };
  }

  public get verifyConsensusPayloadOptions(): VerifyConsensusPayloadOptions {
    return {
      vm: this.vm,
      storage: this.storage,
      native: this.native,
      verifyWitnesses: this.verifyWitnesses,
      height: this.currentBlockIndex,
    };
  }

  public get blocks() {
    return this.storage.blocks;
  }

  public get nep5Balances() {
    return this.storage.nep5Balances;
  }

  public get nep5TransfersReceived() {
    return this.storage.nep5TransfersReceived;
  }

  public get nep5TransfersSent() {
    return this.storage.nep5TransfersSent;
  }

  public get applicationLogs() {
    return this.storage.applicationLogs;
  }

  public get transactions() {
    return this.storage.transactions;
  }

  public get contracts() {
    return this.storage.contracts;
  }

  public get storages() {
    return this.storage.storages;
  }

  public get headerHashList() {
    return this.storage.headerHashList;
  }

  public get blockHashIndex() {
    return this.storage.blockHashIndex;
  }

  public get headerHashIndex() {
    return this.storage.headerHashIndex;
  }

  public get contractID() {
    return this.storage.contractID;
  }

  public get consensusState() {
    return this.storage.consensusState;
  }

  public get serializeJSONContext() {
    return {
      addressVersion: this.settings.addressVersion,
      messageMagic: this.settings.messageMagic,
    };
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

    logger.info({ name: 'neo_blockchain_stop' }, 'NEO blockchain stopped.');
  }

  public async reset(): Promise<void> {
    await this.stop();
    await this.storage.reset();
    this.mutableCurrentHeader = undefined;
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
  ): Promise<VerifyResultModel> {
    const containsTransaction = await this.containsTransaction(transaction.hash, mempool);
    if (containsTransaction) {
      return VerifyResultModel.AlreadyExists;
    }

    // TODO: to save some compute time we could keep a local cache of the current blocks return values
    // from native contract calls and pass those in, instead of passing the whole native container.
    const verifyOptions = {
      native: this.native,
      vm: this.vm,
      storage: this.storage,
      verifyWitnesses: this.verifyWitnesses,
    };

    return transaction.verify(verifyOptions, context);
  }

  public async verifyConsensusPayload(payload: ConsensusPayload) {
    const verification = await payload.verify(this.verifyConsensusPayloadOptions);
    if (!verification) {
      throw new ConsensusPayloadVerifyError(payload.hashHex);
    }
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

    const trimmedBlock = await this.blocks.tryGet({ hashOrIndex: hash });
    if (trimmedBlock === undefined) {
      return undefined;
    }

    if (!trimmedBlock.isBlock) {
      return undefined;
    }

    return trimmedBlock.getBlock(this.transactions);
  }

  public async getBlockHash(index: number): Promise<UInt256 | undefined> {
    if (this.headerIndexCache.length <= index) {
      return undefined;
    }

    return this.headerIndexCache.get(index);
  }

  public async getHeader(hashOrIndex: UInt256 | number): Promise<Header | undefined> {
    const hashPromise = typeof hashOrIndex === 'number' ? this.getBlockHash(hashOrIndex) : Promise.resolve(hashOrIndex);
    const hash = await hashPromise;
    if (hash === undefined) {
      return undefined;
    }

    if (this.currentBlock.hash.equals(hash)) {
      return this.currentBlock.header;
    }

    if (this.previousBlock?.hash.equals(hash)) {
      return this.previousBlock.header;
    }

    const block = await this.blocks.tryGet({ hashOrIndex: hash });

    return block?.header;
  }

  public async getNextBlockHash(hash: UInt256): Promise<UInt256 | undefined> {
    const header = await this.getHeader(hash);
    if (header === undefined) {
      return undefined;
    }

    return this.getBlockHash(header.index + 1);
  }

  public async getValidators(): Promise<readonly ECPoint[]> {
    return this.native.NEO.getValidators(this.storage);
  }

  public async getNextBlockValidators(): Promise<readonly ECPoint[]> {
    return this.native.NEO.getNextBlockValidators(this.storage);
  }

  public async getMaxBlockSize(): Promise<number> {
    return this.native.Policy.getMaxBlockSize(this.storage);
  }

  public async getMaxBlockSystemFee(): Promise<BN> {
    return this.native.Policy.getMaxBlockSystemFee(this.storage);
  }

  public async getMaxTransactionsPerBlock(): Promise<number> {
    return this.native.Policy.getMaxTransactionsPerBlock(this.storage);
  }

  public async getFeePerByte(): Promise<BN> {
    return this.native.Policy.getFeePerByte(this.storage);
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
    const contract = await this.contracts.tryGet(contractHash);
    if (contract === undefined) {
      return { fee: utils.ZERO, size: 0 };
    }

    return utils.verifyContract(contract, this.vm, transaction);
  }

  public testTransaction(transaction: Transaction): CallReceipt {
    return this.runEngineWrapper({
      script: transaction.script,
      snapshot: 'clone',
      container: transaction,
      gas: common.ONE_HUNDRED_FIXED8,
      testMode: true,
    });
  }

  public invokeScript(script: Buffer, signers?: Signers): CallReceipt {
    return this.runEngineWrapper({
      script,
      snapshot: 'main',
      container: signers,
      gas: common.TEN_FIXED8,
    });
  }

  public invokeTransaction<TTransaction extends { readonly script: Buffer }>(
    transaction: TTransaction,
    gas: BN,
  ): CallReceipt {
    return this.vm.withApplicationEngine(
      {
        trigger: TriggerType.Application,
        gas,
        // container: transaction,
        snapshot: 'main',
        testMode: true,
      },
      (engine) => {
        engine.loadScript(transaction.script);

        return wrapExecuteScripts(engine);
      },
    );
  }

  private runEngineWrapper({
    script,
    snapshot,
    container,
    persistingBlock,
    offset = 0,
    testMode = false,
    gas = new BN(0),
  }: RunEngineOptions): CallReceipt {
    return this.vm.withSnapshots(({ main, clone }) => {
      const handler = snapshot === 'main' ? main : clone;
      if (persistingBlock !== undefined) {
        handler.setPersistingBlock(persistingBlock);
      } else if (!handler.hasPersistingBlock()) {
        handler.setPersistingBlock(this.createDummyBlock());
      }

      return this.vm.withApplicationEngine(
        {
          trigger: TriggerType.Application,
          container,
          snapshot,
          gas,
          testMode,
        },
        (engine) => {
          engine.loadScript(script);
          engine.setInstructionPointer(offset);
          engine.execute();

          return utils.getCallReceipt(engine, container);
        },
      );
    });
  }

  private async containsTransaction(hash: UInt256, mempool: Mempool) {
    const hashHex = common.uInt256ToHex(hash);
    if (mempool[hashHex] !== undefined) {
      return true;
    }

    const state = await this.transactions.tryGet(hash);

    return state !== undefined;
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
    logger.info({ name: 'neo_blockchain_start' }, 'Neo blockchain started.');
  }

  private updateBlockMetadata(block: Block): ChangeSet {
    const newHashIndexState = new HashIndexState({ hash: block.hash, index: block.index });
    const updateBlockHashIndex: Change = {
      type: 'add',
      change: { type: 'blockHashIndex', value: newHashIndexState },
      subType: 'update',
    };

    const updateHeaderHashIndex: Change = {
      type: 'add',
      change: { type: 'headerHashIndex', value: newHashIndexState },
      subType: 'update',
    };

    this.mutablePreviousBlock = this.mutableCurrentBlock;
    this.mutableCurrentBlock = block;
    this.mutableCurrentHeader = block.header;

    return [updateBlockHashIndex, updateHeaderHashIndex];
  }

  private updateNep5Balances({
    applicationsExecuted,
    block,
  }: {
    readonly applicationsExecuted: readonly ApplicationExecuted[];
    readonly block: Block;
  }) {
    const { assetKeys, transfersSent, transfersReceived } = getNep5UpdateOptions({
      applicationsExecuted,
      block,
    });

    const nep5BalancePairs = assetKeys.map((key) => {
      const script = new ScriptBuilder().emitAppCall(key.assetScriptHash, 'balanceOf', key.userScriptHash).build();
      const callReceipt = this.invokeScript(script);
      const balanceBuffer = callReceipt.stack[0].getInteger().toBuffer();

      return { key, value: new Nep5Balance({ balanceBuffer, lastUpdatedBlock: this.currentBlockIndex }) };
    });

    const nep5BalanceChangeSet: ChangeSet = nep5BalancePairs.map(({ key, value }) => {
      if (value.balance.eqn(0)) {
        return {
          type: 'delete',
          change: {
            type: 'nep5Balance',
            key,
          },
        };
      }

      return {
        type: 'add',
        change: {
          type: 'nep5Balance',
          key,
          value,
        },
        subType: 'update',
      };
    });

    const nep5TransfersSentChangeSet: ChangeSet = transfersSent.map(({ key, value }) => ({
      type: 'add',
      subType: 'add',
      change: {
        type: 'nep5TransferSent',
        key,
        value,
      },
    }));

    const nep5TransfersReceivedChangeSet: ChangeSet = transfersReceived.map(({ key, value }) => ({
      type: 'add',
      subType: 'add',
      change: {
        type: 'nep5TransferReceived',
        key,
        value,
      },
    }));

    return nep5BalanceChangeSet.concat(nep5TransfersReceivedChangeSet, nep5TransfersSentChangeSet);
  }

  private updateApplicationLogs({
    applicationsExecuted,
    block,
  }: {
    readonly applicationsExecuted: readonly ApplicationExecuted[];
    readonly block: Block;
  }): ChangeSet {
    return applicationsExecuted.map(
      ({ transaction, trigger, state: vmState, gasConsumed, stack, notifications: notificationsIn }) => {
        const notifications = notificationsIn.map(
          ({ scriptHash, eventName, state }) =>
            new Notification({
              scriptHash,
              eventName,
              state,
            }),
        );

        const value = new ApplicationLog({
          txid: transaction?.hash,
          trigger,
          vmState,
          gasConsumed,
          stack,
          notifications,
        });

        return {
          type: 'add',
          subType: 'add',
          change: {
            type: 'applicationLog',
            key: transaction?.hash ?? block.hash,
            value,
          },
        };
      },
    );
  }

  private async persistBlockInternal(block: Block, verify?: boolean): Promise<void> {
    if (verify) {
      await this.verifyBlock(block);
    }

    const blockchain = this.createPersistingBlockchain();

    const currentHeaderCount = this.headerIndexCache.length;
    if (block.index === currentHeaderCount) {
      await this.headerIndexCache.push(block.hash);
    }

    const { changeBatch: persistBatch, applicationsExecuted } = blockchain.persistBlock(block, currentHeaderCount);
    await this.storage.commitBatch(persistBatch);

    const blockMetadataBatch = this.updateBlockMetadata(block);
    await this.storage.commit(blockMetadataBatch);

    const nep5Updates = this.updateNep5Balances({ applicationsExecuted, block });
    await this.storage.commit(nep5Updates);

    const applicationLogUpdates = this.updateApplicationLogs({ applicationsExecuted, block });
    await this.storage.commit(applicationLogUpdates);

    this.vm.updateSnapshots();
  }

  private createPersistingBlockchain(): PersistingBlockchain {
    return new PersistingBlockchain({
      onPersistNativeContractScript: this.onPersistNativeContractScript,
      vm: this.vm,
    });
  }

  private createDummyBlock(): Block {
    return new Block({
      version: 0,
      previousHash: this.currentBlock.hash,
      timestamp: this.currentBlock.timestamp.addn(this.settings.millisecondsPerBlock),
      index: this.currentBlockIndex + 1,
      nextConsensus: this.currentBlock.nextConsensus,
      witness: new Witness({
        invocation: Buffer.from([]),
        verification: Buffer.from([]),
      }),
      consensusData: new ConsensusData({ primaryIndex: 0, nonce: new BN(0) }),
      transactions: [],
      messageMagic: this.settings.messageMagic,
    });
  }
}
