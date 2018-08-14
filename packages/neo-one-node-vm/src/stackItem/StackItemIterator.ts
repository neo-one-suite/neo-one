import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { map } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
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
    const iterable = AsyncIterableX.from(this.enumerator as AsyncIterableIterator<Value>).pipe(
      map(({ key }) => ({ value: key })),
    );

    return new StackItemEnumerator(iterable[Symbol.asyncIterator]());
  }

  public values(): StackItemEnumerator {
    const iterable = AsyncIterableX.from(this.enumerator as AsyncIterableIterator<Value>).pipe(
      map(({ value }) => ({ value })),
    );

    return new StackItemEnumerator(iterable[Symbol.asyncIterator]());
  }
}
