import { Output } from '@neo-one/node-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class OutputStackItem extends EquatableKeyStackItem<Output> {
  public asOutput(): Output {
    return this.value;
  }
}
