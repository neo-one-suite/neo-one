import { InvalidChangeViewReasonError } from '../../errors';

export enum ChangeViewReason {
  Timeout = 0x0,
  ChangeAgreement = 0x1,
  TxNotFound = 0x2,
  TxRejectedByPolicy = 0x3,
  TxInvalid = 0x4,
  BlockRejectedByPolicy = 0x5,
}

const isChangeViewReason = (value: number): value is ChangeViewReason =>
  // tslint:disable-next-line strict-type-predicates
  ChangeViewReason[value] !== undefined;

export const assertChangeViewReason = (value: number): ChangeViewReason => {
  if (isChangeViewReason(value)) {
    return value;
  }
  throw new InvalidChangeViewReasonError(value);
};
