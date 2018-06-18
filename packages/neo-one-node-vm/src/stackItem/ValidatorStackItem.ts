import { Validator } from '@neo-one/client-core';
import { ObjectStackItem } from './ObjectStackItem';

export class ValidatorStackItem extends ObjectStackItem<Validator> {
  public asValidator(): Validator {
    return this.value;
  }
}
