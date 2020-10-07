import { NativeContractStorageContext } from './Native';
import { Transaction } from './transaction';

export interface TransactionVerificationContext {
  readonly addTransaction: (tx: Transaction) => void;
  readonly checkTransaction: (tx: Transaction, storage: NativeContractStorageContext) => Promise<boolean>;
  readonly removeTransaction: (tx: Transaction) => void;
}
