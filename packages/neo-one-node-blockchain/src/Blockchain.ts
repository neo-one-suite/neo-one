import { common, UInt256, VerifyResultModel } from '@neo-one/client-common';
import { createChild, nodeLogger } from '@neo-one/logger';
import {
  Block,
  Blockchain as BlockchainType,
  BlockchainSettings,
  CallReceipt,
  Change,
  ConsensusPayload,
  DeserializeWireContext,
  HashIndexState,
  Header,
  Mempool,
  NativeContainer,
  RunEngineOptions,
  Signers,
  Storage,
  Transaction,
  TransactionVerificationContext,
  TriggerType,
  VerifyConsensusPayloadOptions,
  VerifyOptions,
  VM,
  Witness,
} from '@neo-one/node-core';
import { Labels } from '@neo-one/utils';
import PriorityQueue from 'js-priority-queue';
import { Observable, Subject } from 'rxjs';
import { flatMap, map, toArray } from 'rxjs/operators';
import { BlockVerifyError, ConsensusPayloadVerifyError, GenesisBlockNotRegisteredError } from './errors';
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
  readonly headerIndex: UInt256[];
  readonly storedHeaderCount: number;
  readonly currentBlock?: Block;
}

interface Entry {
  readonly block: Block;
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
  readonly verify: boolean;
}

const hashListBatchSize = 2000;
export const recoverHeaderIndex = async (storage: Storage) => {
  const initHeaderIndex = await storage.headerHashList.all$
    .pipe(
      flatMap((value) => value.hashes),
      toArray(),
    )
    .toPromise();

  const storedHeaderCount = initHeaderIndex.length;
  logger.debug({ name: 'recover_header_index_stored_count', count: storedHeaderCount });

  if (storedHeaderCount !== 0) {
    const hashIndex = await storage.headerHashIndex.get();
    let extraHashes: readonly UInt256[] = [];
    if (hashIndex.index >= storedHeaderCount) {
      let hash = hashIndex.hash;
      // tslint:disable-next-line: no-loop-statement possible-timing-attack
      while (hash !== initHeaderIndex[storedHeaderCount - 1]) {
        extraHashes = [hash].concat(extraHashes);
        const { previousHash } = await storage.blocks.get({ hashOrIndex: hash });
        hash = previousHash;
      }

      return { headerIndex: initHeaderIndex.concat(extraHashes), storedHeaderCount };
    }
  }

  const sortedTrimmedBlocks = await storage.blocks.all$
    .pipe(
      toArray(),
      map((blocks) => blocks.slice().sort(utils.blockComparator)),
    )
    .toPromise();

  return { headerIndex: sortedTrimmedBlocks.map((block) => block.header.hash), storedHeaderCount: 0 };
};

export class Blockchain {
  public static async create({ settings, storage, native, vm }: CreateBlockchainOptions): Promise<BlockchainType> {
    const { headerIndex, storedHeaderCount } = await recoverHeaderIndex(storage);
    if (headerIndex.length > 0) {
      const currentBlockTrimmed = await storage.blocks.tryGet({ hashOrIndex: headerIndex[headerIndex.length - 1] });
      if (currentBlockTrimmed === undefined) {
        throw new Error('testing');
      }

      const currentBlock = await currentBlockTrimmed.getBlock(storage.transactions);

      return new Blockchain({
        headerIndex,
        storedHeaderCount,
        settings,
        storage,
        native,
        vm,
        currentBlock,
      });
    }

    const blockchain = new Blockchain({
      headerIndex,
      storedHeaderCount,
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
  private readonly headerIndex: UInt256[];
  private readonly storage: Storage;
  private readonly native: NativeContainer;
  private readonly vm: VM;

  private mutableStoredHeaderCount: number;
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
    this.headerIndex = options.headerIndex;
    this.mutableStoredHeaderCount = options.storedHeaderCount;
    this.settings = options.settings;
    this.storage = options.storage;
    this.native = options.native;
    this.vm = options.vm;
    this.onPersistNativeContractScript =
      options.onPersistNativeContractScript ?? utils.getOnPersistNativeContractScript();
    this.deserializeWireContext = {
      messageMagic: this.settings.messageMagic,
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

  public get storedHeaderCount(): number {
    return this.mutableStoredHeaderCount;
  }

  public get currentBlockIndex(): number {
    return this.mutableCurrentBlock === undefined ? -1 : this.currentBlock.index;
  }

  public get currentHeaderIndex(): number {
    return this.headerIndex.length;
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

  public get serializeJSONContext() {
    return {
      addressVersion: this.settings.addressVersion,
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
    const hash = typeof hashOrIndex === 'number' ? this.getBlockHash(hashOrIndex) : hashOrIndex;
    if (hash === undefined) {
      return undefined;
    }

    if (this.currentBlock.hash.equals(hash)) {
      return this.currentBlock;
    }

    if (this.previousBlock?.hash.equals(hash)) {
      return this.previousBlock;
    }

    // TODO: this should really just take a hash, and then the rpc handler can call `blockchain.getBlockHash` if its an index.
    const trimmedBlock = await this.blocks.tryGet({ hashOrIndex: hash });
    if (trimmedBlock === undefined) {
      return undefined;
    }

    if (!trimmedBlock.isBlock) {
      return undefined;
    }

    return trimmedBlock.getBlock(this.transactions);
  }

  public getBlockHash(index: number): UInt256 | undefined {
    if (this.headerIndex.length <= index) {
      return undefined;
    }

    return this.headerIndex[index];
  }

  public async getHeader(hashOrIndex: UInt256 | number): Promise<Header | undefined> {
    const hash = typeof hashOrIndex === 'number' ? this.getBlockHash(hashOrIndex) : hashOrIndex;
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

  public invokeScript(script: Buffer, signers?: Signers): CallReceipt {
    return this.runEngineWrapper({
      script,
      snapshot: 'main',
      container: signers,
      gas: 10,
    });
  }

  public invokeTransaction<TTransaction extends { readonly script: Buffer }>(
    transaction: TTransaction,
    gas: number,
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
    gas = 0,
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

          return utils.getCallReceipt(engine);
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

  private async saveHeaderHashList(): Promise<void> {
    if (this.headerIndex.length - this.storedHeaderCount < hashListBatchSize) {
      return;
    }

    const blockchain = this.createPersistingBlockchain();
    const { changeSet, countIncrement } = await blockchain.getHeaderHashListChanges(
      this.headerIndex,
      this.storedHeaderCount,
    );
    await this.storage.commit(changeSet);
    this.mutableStoredHeaderCount += countIncrement;
  }

  private async updateBlockMetadata(block: Block): Promise<void> {
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

    return this.storage.commit([updateBlockHashIndex, updateHeaderHashIndex]);
  }

  private async persistBlockInternal(block: Block, verify?: boolean): Promise<void> {
    if (verify) {
      await this.verifyBlock(block);
    }

    const currentHeaderCount = this.headerIndex.length;
    if (block.transactions.length !== 0) {
      logger.debug({ name: 'BLOCK_PERSIST_WITH_TRANSACTION', block: block.serializeJSON(this.serializeJSONContext) });
      logger.error({ name: 'SEE THIS ONE LOOK AT IT' });
      logger.error({ name: 'SEE THIS ONE LOOK AT IT' });
    }

    const blockchain = this.createPersistingBlockchain();

    if (block.index === currentHeaderCount) {
      this.headerIndex.push(block.hash);
    }

    const { changeBatch, applicationsExecuted } = blockchain.persistBlock(block, currentHeaderCount);
    await this.storage.commitBatch(changeBatch);
    await this.saveHeaderHashList();

    await this.updateBlockMetadata(block);
  }

  private createPersistingBlockchain(): PersistingBlockchain {
    return new PersistingBlockchain({
      onPersistNativeContractScript: this.onPersistNativeContractScript,
      storage: this.storage,
      vm: this.vm,
    });
  }

  private createDummyBlock(): Block {
    return new Block({
      version: 0,
      previousHash: this.currentBlock.hash,
      merkleRoot: common.ZERO_UINT256,
      timestamp: this.currentBlock.timestamp.addn(this.settings.millisecondsPerBlock),
      index: this.currentBlockIndex + 1,
      nextConsensus: this.currentBlock.nextConsensus,
      witness: new Witness({
        invocation: Buffer.from([]),
        verification: Buffer.from([]),
      }),
      transactions: [],
    });
  }
}
