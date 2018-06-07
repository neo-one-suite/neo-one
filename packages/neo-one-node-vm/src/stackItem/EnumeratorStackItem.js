/* @flow */
import ObjectStackItem from './ObjectStackItem';
import StackItemEnumerator from './StackItemEnumerator';
import type StackItemBase from './StackItemBase';

export default class EnumeratorStackItem<
  T: { value: StackItemBase },
  TEnumerator: StackItemEnumerator<T>,
> extends ObjectStackItem<TEnumerator> {
  asEnumerator(): StackItemEnumerator<{ value: StackItemBase }> {
    return (this.value: $FlowFixMe);
  }
}
