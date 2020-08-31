import { Block, Blockchain as BlockchainType, BlockchainSettings, Header, Storage, VM } from '@neo-one/csharp-core';
import PriorityQueue from 'js-priority-queue';
import { Subject } from 'rxjs';
import { GenesisBlockNotRegisteredError } from './errors';
import { verifyWitnesses } from './verify';
import { WriteBatchBlockchain } from './WriteBatchBlockchain';

// TODO: bring logger over when its time;
const logger = console;

export interface CreateBlockchainOptions {
  readonly settings: BlockchainSettings;
  readonly storage: Storage;
  readonly vm: VM;
}

export interface BlockchainOptions extends CreateBlockchainOptions {
  readonly currentBlock: Block | undefined;
  readonly previousBlock: Block | undefined;
  readonly currentHeader: Header | undefined;
}

interface Entry {
  readonly block: Block;
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
  readonly verify: boolean;
}

export class Blockchain {
  public static async create({ settings, storage, vm }: CreateBlockchainOptions): Promise<BlockchainType> {
    throw new Error('not implemented');
  }
  private readonly settings: BlockchainSettings;
  private readonly storage: Storage;
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
    this.settings = options.settings;
    this.storage = options.storage;
    this.vm = options.vm;
  }

  public get currentBlock(): Block {
    if (this.mutableCurrentBlock === undefined) {
      throw new GenesisBlockNotRegisteredError();
    }

    return this.mutableCurrentBlock;
  }

  public get currentBlockIndex(): number {
    return this.mutableCurrentBlock === undefined ? -1 : this.currentBlock.index;
  }

  // TODO: make sure all of this storage is implemented
  public get storageMethods() {
    return {
      tryGetBlock: this.storage.block.tryGet,
      tryGetHeader: this.storage.header.tryGet,
      tryGetContract: this.storage.contract.tryGet,
      tryGetStorage: this.storage.item.tryGet,
    };
  }

  public async verifyBlock(block: Block): Promise<void> {
    const verification = await block.verify(this.storageMethods, verifyWitnesses);
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

  private async persistBlockInternal(block: Block, verify?: boolean): Promise<void> {
    if (verify) {
      await this.verifyBlock(block);
    }

    const blockchain = this.createWriteBlockchain();

    await blockchain.persistBlock(block);
    await this.storage.commit(blockchain.getChangeSet());

    this.mutablePreviousBlock = this.mutableCurrentBlock;
    this.mutableCurrentBlock = block;
    this.mutableCurrentHeader = block.header;
  }

  private createWriteBlockchain(): WriteBatchBlockchain {
    return new WriteBatchBlockchain({
      settings: this.settings,
      currentBlock: this.mutableCurrentBlock,
      currentHeader: this.mutableCurrentHeader,
      storage: this.storage,
      vm: this.vm,
      getValidators: this.getValidators,
    });
  }
}
