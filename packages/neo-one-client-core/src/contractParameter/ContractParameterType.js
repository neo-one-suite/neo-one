/* @flow */
import { CustomError } from '@neo-one/utils';

export const CONTRACT_PARAMETER_TYPE = {
  SIGNATURE: 0x00,
  BOOLEAN: 0x01,
  INTEGER: 0x02,
  HASH160: 0x03,
  HASH256: 0x04,
  BYTE_ARRAY: 0x05,
  PUBLIC_KEY: 0x06,
  STRING: 0x07,
  ARRAY: 0x10,
  INTEROP_INTERFACE: 0xf0,
  VOID: 0xff,
};

export type ContractParameterType =
  | 0x00
  | 0x01
  | 0x02
  | 0x03
  | 0x04
  | 0x05
  | 0x06
  | 0x07
  | 0x10
  | 0xf0
  | 0xff;

export class InvalidContractParameterTypeError extends CustomError {
  code: string;
  contractParameterType: number;

  constructor(contractParameterType: number) {
    super(
      `Expected contract parameter type, ` +
        `found: ${contractParameterType.toString(16)}`,
    );
    this.contractParameterType = contractParameterType;
    this.code = 'INVALID_CONTRACT_PARAMETER_TYPE';
  }
}

export const assertContractParameterType = (
  value: number,
): ContractParameterType => {
  switch (value) {
    case CONTRACT_PARAMETER_TYPE.SIGNATURE:
      return CONTRACT_PARAMETER_TYPE.SIGNATURE;
    case CONTRACT_PARAMETER_TYPE.BOOLEAN:
      return CONTRACT_PARAMETER_TYPE.BOOLEAN;
    case CONTRACT_PARAMETER_TYPE.INTEGER:
      return CONTRACT_PARAMETER_TYPE.INTEGER;
    case CONTRACT_PARAMETER_TYPE.HASH160:
      return CONTRACT_PARAMETER_TYPE.HASH160;
    case CONTRACT_PARAMETER_TYPE.HASH256:
      return CONTRACT_PARAMETER_TYPE.HASH256;
    case CONTRACT_PARAMETER_TYPE.BYTE_ARRAY:
      return CONTRACT_PARAMETER_TYPE.BYTE_ARRAY;
    case CONTRACT_PARAMETER_TYPE.PUBLIC_KEY:
      return CONTRACT_PARAMETER_TYPE.PUBLIC_KEY;
    case CONTRACT_PARAMETER_TYPE.STRING:
      return CONTRACT_PARAMETER_TYPE.STRING;
    case CONTRACT_PARAMETER_TYPE.ARRAY:
      return CONTRACT_PARAMETER_TYPE.ARRAY;
    case CONTRACT_PARAMETER_TYPE.INTEROP_INTERFACE:
      return CONTRACT_PARAMETER_TYPE.INTEROP_INTERFACE;
    // TODO: Seems to be a bug in the TestNet
    case 0x16:
      return CONTRACT_PARAMETER_TYPE.ARRAY;
    case CONTRACT_PARAMETER_TYPE.VOID:
      return CONTRACT_PARAMETER_TYPE.VOID;
    default:
      throw new InvalidContractParameterTypeError(value);
  }
};

export class InvalidContractParameterTypeJSONError extends CustomError {
  code: string;
  value: string;

  constructor(value: string) {
    super(`Invalid ContractParameterType: ${value}`);
    this.value = value;
    this.code = 'INVALID_CONTRACT_PARAMETER_TYPE_JSON';
  }
}

export type ContractParameterTypeJSON =
  | 'Signature'
  | 'Boolean'
  | 'Integer'
  | 'Hash160'
  | 'Hash256'
  | 'ByteArray'
  | 'PublicKey'
  | 'String'
  | 'Array'
  | 'InteropInterface'
  | 'Void';

export const toJSONContractParameterType = (
  type: ContractParameterType,
): ContractParameterTypeJSON => {
  switch (type) {
    case 0x00:
      return 'Signature';
    case 0x01:
      return 'Boolean';
    case 0x02:
      return 'Integer';
    case 0x03:
      return 'Hash160';
    case 0x04:
      return 'Hash256';
    case 0x05:
      return 'ByteArray';
    case 0x06:
      return 'PublicKey';
    case 0x07:
      return 'String';
    case 0x10:
      return 'Array';
    case 0xf0:
      return 'InteropInterface';
    case 0xff:
      return 'Void';
    default:
      // eslint-disable-next-line
      (type: empty);
      throw new InvalidContractParameterTypeError(type);
  }
};

export const assertContractParameterTypeJSON = (
  value: string,
): ContractParameterTypeJSON => {
  switch (value) {
    case 'Signature':
      return 'Signature';
    case 'Boolean':
      return 'Boolean';
    case 'Integer':
      return 'Integer';
    case 'Hash160':
      return 'Hash160';
    case 'Hash256':
      return 'Hash256';
    case 'ByteArray':
      return 'ByteArray';
    case 'PublicKey':
      return 'PublicKey';
    case 'String':
      return 'String';
    case 'Array':
      return 'Array';
    case 'InteropInterface':
      return 'InteropInterface';
    case 'Void':
      return 'Void';
    default:
      throw new InvalidContractParameterTypeJSONError(value);
  }
};

export const toContractParameterType = (
  value: ContractParameterTypeJSON,
): ContractParameterType => {
  switch (value) {
    case 'Signature':
      return 0x00;
    case 'Boolean':
      return 0x01;
    case 'Integer':
      return 0x02;
    case 'Hash160':
      return 0x03;
    case 'Hash256':
      return 0x04;
    case 'ByteArray':
      return 0x05;
    case 'PublicKey':
      return 0x06;
    case 'String':
      return 0x07;
    case 'Array':
      return 0x10;
    case 'InteropInterface':
      return 0xf0;
    case 'Void':
      return 0xff;
    default:
      // eslint-disable-next-line
      (value: empty);
      throw new InvalidContractParameterTypeJSONError(value);
  }
};
