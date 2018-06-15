import { Input } from '@neo-one/client-core';
import { ObjectStackItem } from './ObjectStackItem';

export class InputStackItem extends ObjectStackItem<Input> {
  public asInput(): Input {
    return this.value;
  }
}
