import { CustomError } from '@neo-one/utils';

export enum TransactionType {
  Miner = 0x00,
  Issue = 0x01,
  Claim = 0x02,
  Enrollment = 0x20,
  Register = 0x40,
  Contract = 0x80,
  State = 0x90,
  Publish = 0xd0,
  Invocation = 0xd1,
}

export class InvalidTransactionTypeError extends CustomError {
  public readonly transactionType: number;
  public readonly code: string;

  public constructor(transactionType: number) {
    super(`Expected transaction type, found: ${transactionType.toString(16)}`);
    this.transactionType = transactionType;
    this.code = 'INVALID_TRANSACTION_TYPE';
  }
}

const isTransactionType = (value: number): value is TransactionType =>
  // tslint:disable-next-line strict-type-predicates
  TransactionType[value] !== undefined;

export const assertTransactionType = (value: number): TransactionType => {
  if (isTransactionType(value)) {
    return value;
  }

  throw new InvalidTransactionTypeError(value);
};
