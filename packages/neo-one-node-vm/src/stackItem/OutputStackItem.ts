import { Output } from '@neo-one/client-core';
import { ObjectStackItem } from './ObjectStackItem';

export class OutputStackItem extends ObjectStackItem<Output> {
  public asOutput(): Output {
    return this.value;
  }
}
