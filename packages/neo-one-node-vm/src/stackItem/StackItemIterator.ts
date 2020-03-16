/// <reference types="@reactivex/ix-es2015-cjs" />
import { concat } from '@reactivex/ix-es2015-cjs/asynciterable/concat';
import { from } from '@reactivex/ix-es2015-cjs/asynciterable/from';
import { map } from '@reactivex/ix-es2015-cjs/asynciterable/operators/map';
import { InvalidStorageStackItemIteratorError } from './errors';
import { StackItemBase } from './StackItemBase';
import { StackItemEnumerator } from './StackItemEnumerator';

interface Value {
  readonly key: StackItemBase;
  readonly value: StackItemBase;
}

export class StackItemIterator extends StackItemEnumerator<Value> {
  public key(): StackItemBase {
    const { mutableCurrent } = this;
    if (mutableCurrent === undefined) {
      throw new InvalidStorageStackItemIteratorError();
    }

    return mutableCurrent.key;
  }

  public keys(): StackItemEnumerator {
    const iterable = from(this.enumerator as AsyncIterableIterator<Value>).pipe<{
      value: StackItemBase;
    }>(map(({ key }) => ({ value: key })));

    return new StackItemEnumerator(iterable[Symbol.asyncIterator]());
  }

  public values(): StackItemEnumerator {
    const iterable = from(this.enumerator as AsyncIterableIterator<Value>).pipe<{
      value: StackItemBase;
    }>(map(({ value }) => ({ value })));

    return new StackItemEnumerator(iterable[Symbol.asyncIterator]());
  }

  public concatIterator(other: StackItemIterator): StackItemIterator {
    const iterable = concat(
      from(this.enumerator as AsyncIterableIterator<Value>),
      from(other.enumerator as AsyncIterableIterator<Value>),
    );

    return new StackItemIterator(iterable[Symbol.asyncIterator]());
  }
}
