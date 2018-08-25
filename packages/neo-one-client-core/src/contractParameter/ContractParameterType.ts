import { makeErrorWithCode } from '@neo-one/utils';

export enum ContractParameterType {
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

export const InvalidContractParameterTypeJSONError = makeErrorWithCode(
  'INVALID_CONTRACT_PARAMETER_TYPE_JSON',
  (value: string) => `Invalid ContractParameterType: ${value}`,
);

export const InvalidContractParameterTypeError = makeErrorWithCode(
  'INVALID_CONTRACT_PARAMETER_TYPE',
  (contractParameterType: number) => `Expected contract parameter type, found: ${contractParameterType.toString(16)}`,
);

const isContractParameterType = (value: number): value is ContractParameterType =>
  // tslint:disable-next-line strict-type-predicates
  ContractParameterType[value] !== undefined;

export const assertContractParameterType = (value: number): ContractParameterType => {
  if (isContractParameterType(value)) {
    return value;
  }
  throw new InvalidContractParameterTypeError(value);
};

export type ContractParameterTypeJSON = keyof typeof ContractParameterType;

export const toJSONContractParameterType = (type: ContractParameterType): ContractParameterTypeJSON =>
  assertContractParameterTypeJSON(ContractParameterType[type]);

const isContractParameterTypeJSON = (value: string): value is ContractParameterTypeJSON =>
  // tslint:disable-next-line strict-type-predicates no-any
  ContractParameterType[value as any] !== undefined;

export const assertContractParameterTypeJSON = (value: string): ContractParameterTypeJSON => {
  if (isContractParameterTypeJSON(value)) {
    return value;
  }
  throw new InvalidContractParameterTypeJSONError(value);
};

export const toContractParameterType = (value: ContractParameterTypeJSON): ContractParameterType =>
  assertContractParameterType(ContractParameterType[value]);
