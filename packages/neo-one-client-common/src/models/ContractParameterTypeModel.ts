import { InvalidContractParameterTypeError, InvalidContractParameterTypeJSONError } from '../errors';
import { ContractParameterTypeJSON } from './types';

export enum ContractParameterTypeModel {
  Any = 0x00,
  Boolean = 0x10,
  Integer = 0x11,
  ByteArray = 0x12,
  String = 0x13,
  Hash160 = 0x14,
  Hash256 = 0x15,
  PublicKey = 0x16,
  Signature = 0x17,
  Array = 0x20,
  Map = 0x22,
  InteropInterface = 0x30,
  Void = 0xff,
}

export const isContractParameterType = (value: number): value is ContractParameterTypeModel =>
  // tslint:disable-next-line strict-type-predicates
  ContractParameterTypeModel[value] !== undefined;

export const assertContractParameterType = (value: number): ContractParameterTypeModel => {
  if (isContractParameterType(value)) {
    return value;
  }
  throw new InvalidContractParameterTypeError(value);
};

export const toJSONContractParameterType = (type: ContractParameterTypeModel): ContractParameterTypeJSON =>
  assertContractParameterTypeJSON(ContractParameterTypeModel[type]);

const isContractParameterTypeJSON = (value: string): value is ContractParameterTypeJSON =>
  // tslint:disable-next-line strict-type-predicates no-any
  ContractParameterTypeModel[value as any] !== undefined;

export const assertContractParameterTypeJSON = (value: string): ContractParameterTypeJSON => {
  if (isContractParameterTypeJSON(value)) {
    return value;
  }
  throw new InvalidContractParameterTypeJSONError(value);
};

export const toContractParameterType = (value: ContractParameterTypeJSON): ContractParameterTypeModel =>
  assertContractParameterType(ContractParameterTypeModel[value]);
