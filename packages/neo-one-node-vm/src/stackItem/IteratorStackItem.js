/* @flow */
import ObjectStackItem from './ObjectStackItem';
import StackItemIterator from './StackItemIterator';

export default class IteratorStackItem extends ObjectStackItem<
  StackItemIterator,
> {
  asIterator(): StackItemIterator {
    return this.value;
  }
}
