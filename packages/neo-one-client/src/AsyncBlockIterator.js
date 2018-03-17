/* @flow */
import { AsyncIteratorBase } from '@neo-one/client-core';
import type { Monitor } from '@neo-one/monitor';

import _ from 'lodash';

import { type Block, type BlockFilter, type GetOptions } from './types';

type Item =
  | {| type: 'value', value: Block |}
  | {| type: 'error', error: Error |};
type Resolver = {|
  resolve: (value: IteratorResult<Block, void>) => void,
  reject: (reason: Error) => void,
|};

type Client = {
  +getBlockCount: (monitor?: Monitor) => Promise<number>,
  +getBlock: (index: number, options?: GetOptions) => Promise<Block>,
};

type AsyncBlockIteratorOptions = {|
  client: Client,
  filter: BlockFilter,
  fetchTimeoutMS?: number,
  batchSize?: number,
|};

const FETCH_TIMEOUT_MS = 20000;
const QUEUE_SIZE = 1000;
const BATCH_SIZE = 10;

export default class AsyncBlockIterator extends AsyncIteratorBase<
  Block,
  void,
  void,
> {
  _client: Client;
  _items: Array<Item>;
  _resolvers: Array<Resolver>;
  __done: boolean;
  _currentIndex: number;
  _fetching: boolean;
  _startHeight: ?number;
  _indexStop: ?number;
  _fetchTimeoutMS: number;
  _batchSize: number;
  _monitor: Monitor | void;

  constructor({
    client,
    filter,
    fetchTimeoutMS,
    batchSize,
  }: AsyncBlockIteratorOptions) {
    super();
    this._client = client;
    this._items = [];
    this._resolvers = [];
    this.__done = false;
    this._currentIndex = filter.indexStart || 0;
    this._fetching = false;
    this._startHeight = null;
    this._indexStop = filter.indexStop;
    this._fetchTimeoutMS =
      fetchTimeoutMS == null ? FETCH_TIMEOUT_MS : fetchTimeoutMS;
    this._batchSize = batchSize == null ? BATCH_SIZE : batchSize;
    this._monitor =
      filter.monitor == null
        ? undefined
        : filter.monitor.at('async_block_iterator');
  }

  next(): Promise<IteratorResult<Block, void>> {
    if (!this.__done) {
      this._fetch();
    }

    if (this._items.length > 0) {
      const item = this._items.shift();
      if (item.type === 'error') {
        return Promise.reject(item.error);
      }
      return Promise.resolve({ done: false, value: item.value });
    }

    if (this.__done) {
      return Promise.resolve({ done: true });
    }

    return new Promise((resolve, reject) => {
      this._resolvers.push({ resolve, reject });
    });
  }

  _write(value: Block): void {
    this._push({ type: 'value', value });
  }

  _error(error: Error): void {
    this._push({ type: 'error', error });
  }

  _push(item: Item): void {
    if (this.__done) {
      throw new Error('AsyncBlockIterator already ended');
    }

    if (this._resolvers.length > 0) {
      const { resolve, reject } = this._resolvers.shift();
      if (item.type === 'error') {
        reject(item.error);
      } else {
        resolve({ done: false, value: item.value });
      }
    } else {
      this._items.push(item);
    }
  }

  _done(): void {
    this._resolvers.forEach(({ resolve }) => resolve({ done: true }));
    this._resolvers = [];
    this.__done = true;
  }

  _fetch(): void {
    if (this._fetching) {
      return;
    }
    this._fetching = true;
    this._asyncFetch()
      .then(() => {
        this._fetching = false;
      })
      .catch(error => {
        this._fetching = false;
        this._error(error);
      });
  }

  async _asyncFetch(): Promise<void> {
    let startHeight = this._startHeight;
    if (startHeight == null) {
      const blockCount = await this._client.getBlockCount(this._monitor);
      startHeight = blockCount - 1;
      this._startHeight = startHeight;
    }

    const index = this._currentIndex;
    if (this._indexStop != null && index >= this._indexStop) {
      this._done();
    } else if (index >= startHeight) {
      const [block, newStartHeight] = await Promise.all([
        this._fetchOne(index),
        // Refresh the block count in case we got behind somehow
        this._client.getBlockCount(this._monitor),
      ]);
      this._currentIndex += 1;
      this._write(block);
      this._startHeight = newStartHeight;
    } else {
      let toFetch = Math.min(
        QUEUE_SIZE - this._items.length,
        startHeight - index,
      );
      if (this._indexStop != null) {
        toFetch = Math.min(toFetch, this._indexStop - index);
      }
      for (const chunk of _.chunk(_.range(0, toFetch), this._batchSize)) {
        // eslint-disable-next-line
        const blocks = await Promise.all(
          chunk.map(offset => this._fetchOne(index + offset, true)),
        );
        this._currentIndex += chunk.length;
        blocks.forEach(block => this._write(block));
      }
    }
  }

  async _fetchOne(index: number, isBatch?: boolean): Promise<Block> {
    try {
      const block = await this._client.getBlock(
        index,
        isBatch
          ? {
              monitor: this._monitor,
            }
          : {
              timeoutMS: this._fetchTimeoutMS,
              monitor: this._monitor,
            },
      );
      return block;
    } catch (error) {
      if (error.code === 'UNKNOWN_BLOCK') {
        return this._fetchOne(index, isBatch);
      }

      throw error;
    }
  }
}
