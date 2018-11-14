import { Validator } from '@neo-one/node-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class ValidatorStackItem extends EquatableKeyStackItem<Validator> {
  public asValidator(): Validator {
    return this.value;
  }
}
