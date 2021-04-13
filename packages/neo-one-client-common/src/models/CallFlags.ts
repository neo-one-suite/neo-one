import { InvalidFormatError } from '../common';

export enum CallFlags {
  None = 0,
  ReadStates = 0b00000001,
  WriteStates = 0b00000010,
  AllowCall = 0b00000100,
  AllowNotify = 0b00001000,
  // tslint:disable-next-line: no-bitwise
  States = ReadStates | WriteStates,
  // tslint:disable-next-line: no-bitwise
  ReadOnly = ReadStates | AllowCall,
  // tslint:disable-next-line: no-bitwise
  All = States | AllowCall | AllowNotify,
}

// tslint:disable-next-line: strict-type-predicates
export const isCallFlag = (value: number): value is CallFlags => CallFlags[value] !== undefined;

export const assertCallFlags = (value: number): CallFlags => {
  if (isCallFlag(value)) {
    return value;
  }

  throw new InvalidFormatError(`Expected StackItemType, found: ${value}`);
};
