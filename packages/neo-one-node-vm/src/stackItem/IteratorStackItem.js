/* @flow */
import EnumeratorStackItem from './EnumeratorStackItem';
import type StackItemIterator from './StackItemIterator';
import type StackItemBase from './StackItemBase';

export default class IteratorStackItem extends EnumeratorStackItem<
  { key: StackItemBase, value: StackItemBase },
  StackItemIterator,
> {
  asIterator(): StackItemIterator {
    return this.value;
  }
}
