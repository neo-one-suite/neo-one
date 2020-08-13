import { InvalidVerifyResultError, InvalidVerifyResultJSONError } from '../errors';
import { VerifyResultJSON } from './types';

export enum VerifyResultModel {
  Succeed,
  AlreadyExists,
  OutOfMemory,
  UnableToVerify,
  Invalid,
  Expired,
  InsufficientFunds,
  PolicyFail,
  Unknown,
}

export const hasVerifyResult = (
  reason: VerifyResultModel,
  flag: VerifyResultModel,
  // tslint:disable-next-line: no-bitwise
): boolean => (reason & flag) === flag;

export const isVerifyResult = (value: number): value is VerifyResultModel =>
  // tslint:disable-next-line: strict-type-predicates
  VerifyResultModel[value] !== undefined;

export const assertVerifyResult = (value: number): VerifyResultModel => {
  if (!isVerifyResult(value)) {
    throw new InvalidVerifyResultError(value);
  }

  return value;
};

export const toJSONVerifyResult = (reason: VerifyResultModel): VerifyResultJSON =>
  assertVerifyResultJSON(VerifyResultModel[reason]);

export const isVerifyResultJSON = (reason: string): reason is VerifyResultJSON =>
  // tslint:disable-next-line: strict-type-predicates no-any
  VerifyResultModel[reason as any] !== undefined;

export const assertVerifyResultJSON = (reason: string): VerifyResultJSON => {
  if (!isVerifyResultJSON(reason)) {
    throw new InvalidVerifyResultJSONError(reason);
  }

  return reason;
};

export const toVerifyResult = (reason: VerifyResultJSON): VerifyResultModel => VerifyResultModel[reason];
