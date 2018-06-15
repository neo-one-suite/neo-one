import { Contract } from '@neo-one/client-core';
import { ObjectStackItem } from './ObjectStackItem';

export class ContractStackItem extends ObjectStackItem<Contract> {
  public asContract(): Contract {
    return this.value;
  }
}
