/* @flow */
import { type StorageItem, type Equatable } from '@neo-one/client-core';
import BufferStackItem from './BufferStackItem';

import { InvalidStorageStackItemIteratorError } from './errors';

export default class StackItemIterator implements Equatable {
  iterator: AsyncIterator<StorageItem>;
  current: ?StorageItem;
  done: boolean;

  constructor(iterator: AsyncIterator<StorageItem>) {
    this.iterator = iterator;
    this.current = null;
    this.done = false;
  }

  equals(other: mixed): boolean {
    return this === other;
  }

  async next(): Promise<boolean> {
    if (!this.done) {
      const result = await this.iterator.next();
      this.current = result.done ? null : result.value;
      this.done = result.done;
    }

    return this.done;
  }

  key(): BufferStackItem {
    const { current } = this;
    if (current == null) {
      throw new InvalidStorageStackItemIteratorError();
    }

    return new BufferStackItem(current.key);
  }

  value(): BufferStackItem {
    const { current } = this;
    if (current == null) {
      throw new InvalidStorageStackItemIteratorError();
    }

    return new BufferStackItem(current.value);
  }
}
