import { UInt256 } from '@neo-one/client-common';
import { Block, Blockchain as BlockchainType, BlockchainSettings, Header, Storage, VM } from '@neo-one/node-core';
import PriorityQueue from 'js-priority-queue';
import { Subject } from 'rxjs';
import { flatMap, map, toArray } from 'rxjs/operators';
import { GenesisBlockNotRegisteredError } from './errors';
import { PersistingBlockchain } from './PersistingBlockchain';
import { utils } from './utils';
import { verifyWitnesses } from './verify';

// TODO: bring logger over when its time;
const logger = console;

export interface CreateBlockchainOptions {
  readonly onPersistNativeContractScript?: Buffer;
  readonly settings: BlockchainSettings;
  readonly storage: Storage;
  readonly vm: VM;
}

export interface BlockchainOptions extends CreateBlockchainOptions {
  // readonly currentBlock: Block | undefined;
  // readonly previousBlockIndex: HashIndexState | undefined;
  // tslint:disable-next-line: readonly-array
  readonly headerIndex: UInt256[];
}

interface Entry {
  readonly block: Block;
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
  readonly verify: boolean;
}

// TODO: revisit this with more context into how the headerIndex is being used.
export const recoverHeaderIndex = async (storage: Storage) => {
  const initHeaderIndex = await storage.headerHashList
    .getAll$()
    .pipe(
      flatMap((value) => value.hashes),
      toArray(),
    )
    .toPromise();

  const storedHeaderCount = initHeaderIndex.length;

  if (storedHeaderCount !== 0) {
    const hashIndex = await storage.headerHashIndex.get();
    let extraHashes: readonly UInt256[] = [];
    if (hashIndex.index >= storedHeaderCount) {
      let hash = hashIndex.hash;
      // tslint:disable-next-line
      while (hash !== initHeaderIndex[storedHeaderCount - 1]) {
        // tslint:disable-next-line: no-array-mutation
        extraHashes = [hash].concat(extraHashes);
        const { previousHash } = await storage.blocks.get({ hashOrIndex: hash });
        hash = previousHash;
      }

      return initHeaderIndex.concat(extraHashes);
    }
  }

  return storage.blocks
    .getAll$()
    .pipe(
      map((block) => block.header.hash),
      toArray(),
    )
    .toPromise();
};

export class Blockchain {
  public static async create({ settings, storage, vm }: CreateBlockchainOptions): Promise<BlockchainType> {
    const headerIndex = await recoverHeaderIndex(storage);
    const blockchain = new Blockchain({
      headerIndex,
      settings,
      storage,
      vm,
    });

    if (headerIndex.length === 0) {
      await blockchain.persistBlock({ block: settings.genesisBlock });

      return blockchain;
    }

    // TODO: see if we need something similar and how we'll implement it.
    blockchain.loadMempoolPolicy(storage);

    return blockchain;
  }

  // tslint:disable-next-line: readonly-array
  private readonly headerIndex: UInt256[];
  private readonly onPersistNativeContractScript: Buffer;
  private readonly settings: BlockchainSettings;
  private readonly storage: Storage;
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
    this.mutableStoredHeaderCount = this.headerIndex.length;
    this.settings = options.settings;
    this.storage = options.storage;
    this.vm = options.vm;
    this.onPersistNativeContractScript =
      options.onPersistNativeContractScript ?? utils.getOnPersistNativeContractScript();
  }

  public get currentBlock(): Block {
    if (this.mutableCurrentBlock === undefined) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this.mutableCurrentBlock;
  }

  public get storedHeaderCount(): number {
    return this.mutableStoredHeaderCount;
  }

  public get currentBlockIndex(): number {
    return this.mutableCurrentBlock === undefined ? -1 : this.currentBlock.index;
  }

  public async verifyBlock(block: Block): Promise<void> {
    const verification = await block.verify(this.storage, verifyWitnesses);
    if (!verification) {
      // TODO: implement a makeError
      throw new Error('Block Verification Failed');
    }
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
          // [Labels.NEO_BLOCK_INDEX]: entry.block.index, // TODO: bring Label over
          name: 'neo_blockchain_persist_block_top_level',
        };
        try {
          await this.persistBlockInternal(entryNonNull.block, entryNonNull.verify);
          logger.debug(logData);
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
    if (this.headerIndex.length - this.storedHeaderCount < utils.hashListBatchSize) {
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

  private async persistBlockInternal(block: Block, verify?: boolean): Promise<void> {
    if (verify) {
      await this.verifyBlock(block);
    }

    const blockchain = this.createPersistingBlockchain();
    const currentHeaderCount = this.headerIndex.length;

    if (block.index === currentHeaderCount) {
      this.headerIndex.push(block.hash);
    }

    /**
     * TODO: this changeSet is NOT the `ChangeSet` type we expect for a `.commit(...)` like in `saveHeaderHashList`
     * it is the already serialized changeSet coming from the C# VM Snapshot. There won't need to be as much storage
     * change conversion with this changeSet so will probably make 2 different `commit` methods, 1 for each.
     */
    const { changeSet, applicationsExecuted } = blockchain.persistBlock(block, currentHeaderCount);
    await this.storage.commit(changeSet);
    await this.saveHeaderHashList();

    this.mutablePreviousBlock = this.mutableCurrentBlock;
    this.mutableCurrentBlock = block;
    this.mutableCurrentHeader = block.header;
  }

  private createPersistingBlockchain(): PersistingBlockchain {
    return new PersistingBlockchain({
      onPersistNativeContractScript: this.onPersistNativeContractScript,
      storage: this.storage,
      vm: this.vm,
    });
  }
}
