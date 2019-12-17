import { InvalidRelayResultReasonError, InvalidRelayResultReasonJSONError } from '../errors';
import { RelayResultReasonJSON } from './types';
export enum RelayResultReasonModel {
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

export const hasRelayResultReason = (
  reason: RelayResultReasonModel,
  flag: RelayResultReasonModel,
  // tslint:disable-next-line: no-bitwise
): boolean => (reason & flag) === flag;

export const isRelayResultReason = (value: number): value is RelayResultReasonModel =>
  // tslint:disable-next-line: strict-type-predicates
  RelayResultReasonModel[value] !== undefined;

export const assertRelayResultReason = (value: number): RelayResultReasonModel => {
  if (!isRelayResultReason(value)) {
    throw new InvalidRelayResultReasonError(value);
  }

  return value;
};

export const toJSONRelayResultReason = (reason: RelayResultReasonModel): RelayResultReasonJSON =>
  assertRelayResultReasonJSON(RelayResultReasonModel[reason]);

export const isRelayResultReasonJSON = (reason: string): reason is RelayResultReasonJSON =>
  // tslint:disable-next-line: strict-type-predicates no-any
  RelayResultReasonModel[reason as any] !== undefined;

export const assertRelayResultReasonJSON = (reason: string): RelayResultReasonJSON => {
  if (!isRelayResultReasonJSON(reason)) {
    throw new InvalidRelayResultReasonJSONError(reason);
  }

  return reason;
};

export const toRelayResultReason = (reason: RelayResultReasonJSON): RelayResultReasonModel =>
  RelayResultReasonModel[reason];
