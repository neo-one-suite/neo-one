import { ObjectStackItem } from './ObjectStackItem';
import { getNextID } from './referenceCounter';
import { StackItemBase } from './StackItemBase';
import { StackItemEnumerator } from './StackItemEnumerator';

export class EnumeratorStackItem<
  T extends { readonly value: StackItemBase } = { readonly value: StackItemBase },
  TEnumerator extends StackItemEnumerator<T> = StackItemEnumerator<T>
> extends ObjectStackItem<TEnumerator> {
  private readonly referenceID = getNextID();

  public toStructuralKey(): string {
    return `${this.referenceID}`;
  }
  // tslint:disable-next-line no-any
  public equals(other: any): boolean {
    return this === other;
  }

  public asEnumerator(): StackItemEnumerator {
    return this.value;
  }
}
