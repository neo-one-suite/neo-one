import { Input } from '@neo-one/client-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class InputStackItem extends EquatableKeyStackItem<Input> {
  public asInput(): Input {
    return this.value;
  }
}
