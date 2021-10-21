import { InvalidFormatError } from '@neo-one/client-common';
import { InvalidPolicyChangeTypeError } from '../errors';

export enum PolicyChangeType {
  GasPerBlock = 0x00,
  RegisterPrice = 0x01,
  UnregisterCandidate = 0x02,
  RegisterCandidate = 0x03,
  RoleDesignation = 0x04,
  FeePerByte = 0x05,
  ExecFeeFactor = 0x06,
  StoragePrice = 0x07,
  BlockAccount = 0x08,
  UnblockAccount = 0x09,
  MinimumDeploymentFee = 0x0a,
}

const isPolicyChangeType = (value: number): value is PolicyChangeType =>
  // tslint:disable-next-line strict-type-predicates
  PolicyChangeType[value] !== undefined;

export const assertPolicyChangeType = (value: number): PolicyChangeType => {
  if (isPolicyChangeType(value)) {
    return value;
  }

  throw new InvalidPolicyChangeTypeError(value);
};

export type PolicyChangeTypeJSON = keyof typeof PolicyChangeType;

export const isPolicyChangeTypeJSON = (state: string): state is PolicyChangeTypeJSON =>
  // tslint:disable-next-line: strict-type-predicates no-any
  PolicyChangeType[state as any] !== undefined;

export const assertPolicyChangeTypeJSON = (state: string): PolicyChangeTypeJSON => {
  if (isPolicyChangeTypeJSON(state)) {
    return state;
  }

  throw new InvalidFormatError();
};

export const toPolicyChangeTypeJSON = (state: PolicyChangeType) => assertPolicyChangeTypeJSON(PolicyChangeType[state]);
