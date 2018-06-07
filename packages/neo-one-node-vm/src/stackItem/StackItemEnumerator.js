/* @flow */
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import { type Equatable } from '@neo-one/client-core';

import { concat } from 'ix/asynciterable/concat';

import { InvalidStorageStackItemEnumeratorError } from './errors';
import type StackItemBase from './StackItemBase';

export default class StackItemEnumerator<
  T: { value: StackItemBase } = { value: StackItemBase },
> implements Equatable {
  enumerator: AsyncIterator<T>;
  current: ?T;
  done: boolean;

  constructor(enumerator: AsyncIterator<T>) {
    this.enumerator = enumerator;
    this.current = null;
    this.done = false;
  }

  equals(other: mixed): boolean {
    return this === other;
  }

  async next(): Promise<boolean> {
    if (!this.done) {
      const result = await this.enumerator.next();
      this.current = result.done ? null : result.value;
      this.done = result.done;
      if (this.done) {
        return false;
      }
      return true;
    }

    return false;
  }

  value(): StackItemBase {
    const { current } = this;
    if (current == null) {
      throw new InvalidStorageStackItemEnumeratorError();
    }

    return current.value;
  }

  concat(other: StackItemEnumerator<any>): StackItemEnumerator<any> {
    const iterable = concat(
      AsyncIterableX.from(this.enumerator),
      AsyncIterableX.from(other.enumerator),
    );

    return new StackItemEnumerator(this._getIterator(iterable));
  }

  _getIterator<TValue>(
    iterable: AsyncIterableX<TValue>,
  ): AsyncIterator<TValue> {
    return (iterable: $FlowFixMe)[(Symbol: $FlowFixMe).asyncIterator]();
  }
}
