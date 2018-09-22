import { Contract } from '@neo-one/node-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class ContractStackItem extends EquatableKeyStackItem<Contract> {
  public asContract(): Contract {
    return this.value;
  }
}
