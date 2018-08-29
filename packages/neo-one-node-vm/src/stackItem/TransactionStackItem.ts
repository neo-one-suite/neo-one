import { Transaction } from '@neo-one/client-core';
import { EquatableKeyStackItem } from './EquatableKeyStackItem';

export class TransactionStackItem extends EquatableKeyStackItem<Transaction> {
  public asTransaction(): Transaction {
    return this.value;
  }
}
