import { Monitor } from '@neo-one/monitor';
import * as _ from 'lodash';
import { Block, BlockFilter, GetOptions } from './types';

type Item = { readonly type: 'value'; readonly value: Block } | { readonly type: 'error'; readonly error: Error };
interface Resolver {
  readonly resolve: (value: IteratorResult<Block>) => void;
  readonly reject: (reason: Error) => void;
}

interface Client {
  readonly getBlockCount: (monitor?: Monitor) => Promise<number>;
  readonly getBlock: (index: number, options?: GetOptions) => Promise<Block>;
}

interface AsyncBlockIteratorOptions {
  readonly client: Client;
  readonly filter: BlockFilter;
  readonly fetchTimeoutMS?: number;
  readonly batchSize?: number;
}

const FETCH_TIMEOUT_MS = 20000;
const QUEUE_SIZE = 1000;
const BATCH_SIZE = 10;

export class AsyncBlockIterator implements AsyncIterator<Block> {
  private readonly client: Client;
  private readonly mutableItems: Item[];
  private mutableResolvers: Resolver[];
  private mutableDone: boolean;
  private mutableCurrentIndex: number;
  private mutableFetching: boolean;
  private mutableStartHeight: number | undefined;
  private readonly indexStop: number | undefined;
  private readonly fetchTimeoutMS: number;
  private readonly batchSize: number;
  private readonly monitor: Monitor | undefined;

  public constructor({
    client,
    filter: { indexStart = 0, indexStop, monitor },
    fetchTimeoutMS = FETCH_TIMEOUT_MS,
    batchSize = BATCH_SIZE,
  }: AsyncBlockIteratorOptions) {
    this.client = client;
    this.mutableItems = [];
    this.mutableResolvers = [];
    this.mutableDone = false;
    this.mutableCurrentIndex = indexStart;
    this.mutableFetching = false;
    this.indexStop = indexStop;
    this.fetchTimeoutMS = fetchTimeoutMS;
    this.batchSize = batchSize;
    this.monitor = monitor === undefined ? undefined : monitor.at('async_block_iterator');
  }

  public [Symbol.asyncIterator]() {
    return this;
  }

  public async next(): Promise<IteratorResult<Block>> {
    if (!this.mutableDone) {
      this.fetch();
    }

    const item = this.mutableItems.shift();
    if (item !== undefined) {
      if (item.type === 'error') {
        return Promise.reject(item.error);
      }

      return Promise.resolve({ done: false, value: item.value });
    }

    if (this.mutableDone) {
      // tslint:disable-next-line no-any
      return Promise.resolve({ done: true } as any);
    }

    // tslint:disable-next-line promise-must-complete
    return new Promise<IteratorResult<Block>>((resolve, reject) => {
      this.mutableResolvers.push({ resolve, reject });
    });
  }

  private write(value: Block): void {
    this.push({ type: 'value', value });
  }

  private error(error: Error): void {
    this.push({ type: 'error', error });
  }

  private push(item: Item): void {
    if (this.mutableDone) {
      throw new Error('AsyncBlockIterator already ended');
    }

    const resolver = this.mutableResolvers.shift();
    if (resolver !== undefined) {
      const { resolve, reject } = resolver;
      if (item.type === 'error') {
        reject(item.error);
      } else {
        resolve({ done: false, value: item.value });
      }
    } else {
      this.mutableItems.push(item);
    }
  }

  private done(): void {
    // tslint:disable-next-line no-any
    this.mutableResolvers.forEach(({ resolve }) => resolve({ done: true } as any));
    // tslint:disable-next-line no-any
    this.mutableResolvers = [];
    this.mutableDone = true;
  }

  private fetch(): void {
    if (this.mutableFetching) {
      return;
    }
    this.mutableFetching = true;
    this.asyncFetch()
      .then(() => {
        this.mutableFetching = false;
      })
      .catch((error) => {
        this.mutableFetching = false;
        this.error(error);
      });
  }

  private async asyncFetch(): Promise<void> {
    let startHeight = this.mutableStartHeight;
    if (startHeight === undefined) {
      const blockCount = await this.client.getBlockCount(this.monitor);
      startHeight = blockCount - 1;
      this.mutableStartHeight = startHeight;
    }

    const index = this.mutableCurrentIndex;
    if (this.indexStop !== undefined && index >= this.indexStop) {
      this.done();
    } else if (index >= startHeight) {
      const [block, newStartHeight] = await Promise.all([
        this.fetchOne(index),
        // Refresh the block count in case we got behind somehow
        this.client.getBlockCount(this.monitor),
      ]);

      this.mutableCurrentIndex += 1;
      this.write(block);
      this.mutableStartHeight = newStartHeight;
    } else {
      let toFetch = Math.min(QUEUE_SIZE - this.mutableItems.length, startHeight - index);

      if (this.indexStop !== undefined) {
        toFetch = Math.min(toFetch, this.indexStop - index);
      }

      // tslint:disable-next-line no-loop-statement
      for (const chunk of _.chunk(_.range(0, toFetch), this.batchSize)) {
        const blocks = await Promise.all(chunk.map(async (offset) => this.fetchOne(index + offset, true)));

        this.mutableCurrentIndex += chunk.length;
        blocks.forEach((block) => this.write(block));
      }
    }
  }

  private async fetchOne(index: number, isBatch = false): Promise<Block> {
    try {
      // tslint:disable-next-line no-unnecessary-local-variable prefer-immediate-return
      const block = await this.client.getBlock(
        index,
        isBatch
          ? {
              monitor: this.monitor,
            }
          : {
              timeoutMS: this.fetchTimeoutMS,
              monitor: this.monitor,
            },
      );

      // tslint:disable-next-line no-var-before-return
      return block;
    } catch (error) {
      if (error.code === 'UNKNOWN_BLOCK') {
        return this.fetchOne(index, isBatch);
      }

      throw error as Error;
    }
  }
}
