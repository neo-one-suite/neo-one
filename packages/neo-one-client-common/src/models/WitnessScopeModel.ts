import { InvalidWitnessScopeError, InvalidWitnessScopeJSONError } from '../errors';
import { WitnessScopeJSON } from './types';

export enum WitnessScopeModel {
  None = 0x00,
  CalledByEntry = 0x01,
  CustomContracts = 0x10,
  CustomGroups = 0x20,
  Global = 0x80,
  CalledByEntryAndCustomContracts = 0x11,
  CalledByEntryAndCustomGroups = 0x21,
  CalledByEntryAndCustomGroupsAndCustomContracts = 0x31,
  CustomContractsAndCustomGroups = 0x30,
}

export const isWitnessScope = (value: number): value is WitnessScopeModel =>
  // tslint:disable-next-line: strict-type-predicates
  WitnessScopeModel[value] !== undefined;

export const assertWitnessScope = (value: number): WitnessScopeModel => {
  if (isWitnessScope(value)) {
    return value;
  }
  throw new InvalidWitnessScopeError(value);
};

export const toJSONWitnessScope = (type: WitnessScopeModel): WitnessScopeJSON =>
  assertWitnessScopeJSON(WitnessScopeModel[type]);

const isWitnessScopeJSON = (value: string): value is WitnessScopeJSON =>
  // tslint:disable-next-line strict-type-predicates no-any
  WitnessScopeModel[value as any] !== undefined;

export const assertWitnessScopeJSON = (value: string): WitnessScopeJSON => {
  if (isWitnessScopeJSON(value)) {
    return value;
  }
  throw new InvalidWitnessScopeJSONError(value);
};

export const toWitnessScope = (value: WitnessScopeJSON): WitnessScopeModel =>
  assertWitnessScope(WitnessScopeModel[value]);

export const witnessScopeHasFlag = (value: WitnessScopeModel, flag: WitnessScopeModel) => {
  if (
    (value === WitnessScopeModel.Global && flag !== WitnessScopeModel.Global) ||
    (value !== WitnessScopeModel.Global && flag === WitnessScopeModel.Global)
  ) {
    return false;
  }
  // tslint:disable-next-line: no-bitwise
  if ((value & flag) === flag) {
    return true;
  }

  return false;
};
