import { InvalidContractParameterTypeError, InvalidContractParameterTypeJSONError } from '../errors';
import { ContractParameterTypeJSON } from './types';

export enum ContractParameterTypeModel {
  Signature = 0x00,
  Boolean = 0x01,
  Integer = 0x02,
  Hash160 = 0x03,
  Hash256 = 0x04,
  ByteArray = 0x05,
  PublicKey = 0x06,
  String = 0x07,
  Array = 0x10,
  InteropInterface = 0xf0,
  Void = 0xff,
}

const isContractParameterType = (value: number): value is ContractParameterTypeModel =>
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
