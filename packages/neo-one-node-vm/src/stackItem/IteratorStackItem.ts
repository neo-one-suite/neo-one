import { EnumeratorStackItem } from './EnumeratorStackItem';
import { StackItemBase } from './StackItemBase';
import { StackItemIterator } from './StackItemIterator';

export class IteratorStackItem extends EnumeratorStackItem<
  { readonly key: StackItemBase; readonly value: StackItemBase },
  StackItemIterator
> {
  public asIterator(): StackItemIterator {
    return this.value;
  }
}
