import { Account } from '@neo-one/client-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class AccountStackItem extends EquatableKeyStackItem<Account> {
  public asAccount(): Account {
    return this.value;
  }
}
