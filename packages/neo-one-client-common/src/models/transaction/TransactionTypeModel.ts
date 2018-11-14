import { InvalidTransactionTypeError } from '../../errors';

export enum TransactionTypeModel {
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

const isTransactionType = (value: number): value is TransactionTypeModel =>
  // tslint:disable-next-line strict-type-predicates
  TransactionTypeModel[value] !== undefined;

export const assertTransactionType = (value: number): TransactionTypeModel => {
  if (isTransactionType(value)) {
    return value;
  }

  throw new InvalidTransactionTypeError(value);
};
