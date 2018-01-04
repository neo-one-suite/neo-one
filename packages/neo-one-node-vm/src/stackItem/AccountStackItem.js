/* @flow */
import type { Account } from '@neo-one/client-core';

import ObjectStackItem from './ObjectStackItem';

export default class AccountStackItem extends ObjectStackItem<Account> {
  asAccount(): Account {
    return this.value;
  }
}
