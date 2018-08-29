import { Contract } from '@neo-one/client-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class ContractStackItem extends EquatableKeyStackItem<Contract> {
  public asContract(): Contract {
    return this.value;
  }
}
