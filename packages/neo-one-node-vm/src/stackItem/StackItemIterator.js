/* @flow */
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';

import { map } from 'ix/asynciterable/pipe/index';

import { InvalidStorageStackItemIteratorError } from './errors';
import type StackItemBase from './StackItemBase';
import StackItemEnumerator from './StackItemEnumerator';

export default class StackItemIterator extends StackItemEnumerator<{
  key: StackItemBase,
  value: StackItemBase,
}> {
  key(): StackItemBase {
    const { current } = this;
    if (current == null) {
      throw new InvalidStorageStackItemIteratorError();
    }

    return current.key;
  }

  keys(): StackItemEnumerator<> {
    const iterable = AsyncIterableX.from(this.enumerator).pipe(
      map(({ key }) => ({ value: key })),
    );

    return new StackItemEnumerator(this._getIterator(iterable));
  }

  values(): StackItemEnumerator<> {
    const iterable = AsyncIterableX.from(this.enumerator).pipe(
      map(({ value }) => ({ value })),
    );

    return new StackItemEnumerator(this._getIterator(iterable));
  }
}
