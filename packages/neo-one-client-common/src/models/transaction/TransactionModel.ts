import { UInt256 } from '../../common';
import { ClaimTransactionModel } from './ClaimTransactionModel';
import { InvocationTransactionModel } from './InvocationTransactionModel';

export type TransactionModel = ClaimTransactionModel | InvocationTransactionModel;

export interface TransactionModelKey {
  readonly hash: UInt256;
}
