import { Transaction } from '@neo-one/node-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class TransactionStackItem extends EquatableKeyStackItem<Transaction> {
  public asTransaction(): Transaction {
    return this.value;
  }
}
