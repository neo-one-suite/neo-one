import { Output } from '@neo-one/client-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class OutputStackItem extends EquatableKeyStackItem<Output> {
  public asOutput(): Output {
    return this.value;
  }
}
