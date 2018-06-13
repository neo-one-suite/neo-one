import { Monitor } from '@neo-one/monitor';
import _ from 'lodash';
import { Block, BlockFilter, GetOptions } from './types';

type Item = { type: 'value'; value: Block } | { type: 'error'; error: Error };
interface Resolver {
  resolve: (value: IteratorResult<Block>) => void;
  reject: (reason: Error) => void;
}

interface Client {
  readonly getBlockCount: (monitor?: Monitor) => Promise<number>;
  readonly getBlock: (index: number, options?: GetOptions) => Promise<Block>;
}

interface AsyncBlockIteratorOptions {
  client: Client;
  filter: BlockFilter;
  fetchTimeoutMS?: number;
  batchSize?: number;
}

const FETCH_TIMEOUT_MS = 20000;
const QUEUE_SIZE = 1000;
const BATCH_SIZE = 10;

export class AsyncBlockIterator implements AsyncIterator<Block> {
  private readonly client: Client;
  private readonly items: Item[];
  private resolvers: Resolver[];
  private doneInternal: boolean;
  private currentIndex: number;
  private fetching: boolean;
  private startHeight: number | null;
  private readonly indexStop: number | undefined;
  private readonly fetchTimeoutMS: number;
  private readonly batchSize: number;
  private readonly monitor: Monitor | undefined;

  constructor({
    client,
    filter,
    fetchTimeoutMS,
    batchSize,
  }: AsyncBlockIteratorOptions) {
    this.client = client;
    this.items = [];
    this.resolvers = [];
    this.doneInternal = false;
    this.currentIndex = filter.indexStart || 0;
    this.fetching = false;
    this.startHeight = null;
    this.indexStop = filter.indexStop;
    this.fetchTimeoutMS =
      fetchTimeoutMS == null ? FETCH_TIMEOUT_MS : fetchTimeoutMS;
    this.batchSize = batchSize == null ? BATCH_SIZE : batchSize;
    this.monitor =
      filter.monitor == null
        ? undefined
        : filter.monitor.at('async_block_iterator');
  }

  public [Symbol.asyncIterator]() {
    return this;
  }

  public next(): Promise<IteratorResult<Block>> {
    if (!this.doneInternal) {
      this.fetch();
    }

    const item = this.items.shift();
    if (item != null) {
      if (item.type === 'error') {
        return Promise.reject(item.error);
      }
      return Promise.resolve({ done: false, value: item.value });
    }

    if (this.doneInternal) {
      return Promise.resolve({ done: true } as any);
    }

    return new Promise((resolve, reject) => {
      this.resolvers.push({ resolve, reject });
    });
  }

  private write(value: Block): void {
    this.push({ type: 'value', value });
  }

  private error(error: Error): void {
    this.push({ type: 'error', error });
  }

  private push(item: Item): void {
    if (this.doneInternal) {
      throw new Error('AsyncBlockIterator already ended');
    }

    const resolver = this.resolvers.shift();
    if (resolver != null) {
      const { resolve, reject } = resolver;
      if (item.type === 'error') {
        reject(item.error);
      } else {
        resolve({ done: false, value: item.value });
      }
    } else {
      this.items.push(item);
    }
  }

  private done(): void {
    this.resolvers.forEach(({ resolve }) => resolve({ done: true } as any));
    this.resolvers = [];
    this.doneInternal = true;
  }

  private fetch(): void {
    if (this.fetching) {
      return;
    }
    this.fetching = true;
    this.asyncFetch()
      .then(() => {
        this.fetching = false;
      })
      .catch((error) => {
        this.fetching = false;
        this.error(error);
      });
  }

  private async asyncFetch(): Promise<void> {
    let startHeight = this.startHeight;
    if (startHeight == null) {
      const blockCount = await this.client.getBlockCount(this.monitor);
      startHeight = blockCount - 1;
      this.startHeight = startHeight;
    }

    const index = this.currentIndex;
    if (this.indexStop != null && index >= this.indexStop) {
      this.done();
    } else if (index >= startHeight) {
      const [block, newStartHeight] = await Promise.all([
        this.fetchOne(index),
        // Refresh the block count in case we got behind somehow
        this.client.getBlockCount(this.monitor),
      ]);

      this.currentIndex += 1;
      this.write(block);
      this.startHeight = newStartHeight;
    } else {
      let toFetch = Math.min(
        QUEUE_SIZE - this.items.length,
        startHeight - index,
      );

      if (this.indexStop != null) {
        toFetch = Math.min(toFetch, this.indexStop - index);
      }
      for (const chunk of _.chunk(_.range(0, toFetch), this.batchSize)) {
        // eslint-disable-next-line
        const blocks = await Promise.all(
          chunk.map((offset) => this.fetchOne(index + offset, true)),
        );

        this.currentIndex += chunk.length;
        blocks.forEach((block) => this.write(block));
      }
    }
  }

  private async fetchOne(index: number, isBatch?: boolean): Promise<Block> {
    try {
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

      return block;
    } catch (error) {
      if (error.code === 'UNKNOWN_BLOCK') {
        return this.fetchOne(index, isBatch);
      }

      throw error;
    }
  }
}
