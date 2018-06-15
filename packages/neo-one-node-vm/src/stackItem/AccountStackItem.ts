import { Account } from '@neo-one/client-core';
import { ObjectStackItem } from './ObjectStackItem';

export class AccountStackItem extends ObjectStackItem<Account> {
  public asAccount(): Account {
    return this.value;
  }
}
