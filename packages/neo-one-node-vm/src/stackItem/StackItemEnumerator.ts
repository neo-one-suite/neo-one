import { Equatable } from '@neo-one/client-core';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { concat } from '@reactivex/ix-es2015-cjs/asynciterable/concat';
import { InvalidStorageStackItemEnumeratorError } from './errors';
import { StackItemBase } from './StackItemBase';

export class StackItemEnumerator<T extends { readonly value: StackItemBase } = { readonly value: StackItemBase }>
  implements Equatable {
  protected readonly enumerator: AsyncIterator<T>;
  protected mutableCurrent: T | undefined;
  private mutableDone: boolean;

  public constructor(enumerator: AsyncIterator<T>) {
    this.enumerator = enumerator;
    this.mutableDone = false;
  }

  public get done(): boolean {
    return this.mutableDone;
  }

  public equals(other: {}): boolean {
    return this === other;
  }

  public async next(): Promise<boolean> {
    if (!this.mutableDone) {
      const result = await this.enumerator.next();
      this.mutableCurrent = result.done ? undefined : result.value;
      this.mutableDone = result.done;
      if (this.mutableDone) {
        return false;
      }

      return true;
    }

    return false;
  }

  public value(): StackItemBase {
    const { mutableCurrent } = this;
    if (mutableCurrent === undefined) {
      throw new InvalidStorageStackItemEnumeratorError();
    }

    return mutableCurrent.value;
  }

  public concat<TOther extends { readonly value: StackItemBase }>(
    other: StackItemEnumerator<TOther>,
  ): StackItemEnumerator<T | TOther> {
    const iterable = concat(
      AsyncIterableX.from<T>(this.enumerator as AsyncIterableIterator<T>),
      AsyncIterableX.from<TOther>(other.enumerator as AsyncIterableIterator<TOther>),
    );

    return new StackItemEnumerator(iterable[Symbol.asyncIterator]());
  }
}
