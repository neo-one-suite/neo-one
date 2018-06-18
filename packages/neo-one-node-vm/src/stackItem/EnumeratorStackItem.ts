import { ObjectStackItem } from './ObjectStackItem';
import { StackItemBase } from './StackItemBase';
import { StackItemEnumerator } from './StackItemEnumerator';

export class EnumeratorStackItem<
  T extends { readonly value: StackItemBase } = { readonly value: StackItemBase },
  TEnumerator extends StackItemEnumerator<T> = StackItemEnumerator<T>
> extends ObjectStackItem<TEnumerator> {
  public asEnumerator(): StackItemEnumerator {
    return this.value;
  }
}
