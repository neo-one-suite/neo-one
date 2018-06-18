import { Transaction } from '@neo-one/client-core';
import { ObjectStackItem } from './ObjectStackItem';

export class TransactionStackItem extends ObjectStackItem<Transaction> {
  public asTransaction(): Transaction {
    return this.value;
  }
}
