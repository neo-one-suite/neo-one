import { Account } from '@neo-one/node-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class AccountStackItem extends EquatableKeyStackItem<Account> {
  public asAccount(): Account {
    return this.value;
  }
}
