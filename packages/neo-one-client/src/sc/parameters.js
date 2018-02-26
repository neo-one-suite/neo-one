/* @flow */
import type BigNumber from 'bignumber.js';
import {
  InvalidContractParameterTypeJSONError,
  JSONHelper,
  common,
  utils,
} from '@neo-one/client-core';

import type {
  ArrayABI,
  ContractParameter,
  Param,
  SignatureABI,
  SignatureString,
  BooleanABI,
  Hash160ABI,
  Hash160String,
  Hash256ABI,
  Hash256String,
  ByteArrayABI,
  BufferString,
  PublicKeyABI,
  PublicKeyString,
  StringABI,
  InteropInterfaceABI,
  VoidABI,
  IntegerABI,
} from '../types';
import { InvalidContractParameterError } from '../errors';

const toByteArrayBuffer = (contractParameter: ContractParameter): Buffer => {
  let value;
  switch (contractParameter.type) {
    case 'Signature':
      value = JSONHelper.readBuffer(contractParameter.value);
      break;
    case 'Boolean':
      value = contractParameter.value ? Buffer.alloc(1, 1) : Buffer.alloc(1, 0);
      break;
    case 'Integer':
      value = utils.toSignedBuffer(contractParameter.value);
      break;
    case 'Hash160':
      value = common.uInt160ToBuffer(
        JSONHelper.readUInt160(contractParameter.value),
      );
      break;
    case 'Hash256':
      value = common.uInt256ToBuffer(
        JSONHelper.readUInt256(contractParameter.value),
      );
      break;
    case 'ByteArray':
      value = JSONHelper.readBuffer(contractParameter.value);
      break;
    case 'PublicKey':
      value = common.ecPointToBuffer(
        JSONHelper.readECPoint(contractParameter.value),
      );
      break;
    case 'String':
      value = Buffer.from(contractParameter.value, 'utf8');
      break;
    case 'Array':
      throw new InvalidContractParameterError(contractParameter, [
        'Signature',
        'Boolean',
        'Integer',
        'Hash160',
        'Hash256',
        'ByteArray',
        'PublicKey',
        'String',
        'InteropInterface',
        'Void',
      ]);
    case 'InteropInterface':
      value = Buffer.alloc(0, 0);
      break;
    case 'Void':
      value = Buffer.alloc(0, 0);
      break;
    default:
      // eslint-disable-next-line
      (contractParameter.type: empty);
      throw new InvalidContractParameterTypeJSONError(contractParameter.type);
  }

  return value;
};

const toByteArray = (contractParameter: ContractParameter): BufferString =>
  toByteArrayBuffer(contractParameter).toString('hex');

const toBoolean = (contractParameter: ContractParameter) => {
  if (contractParameter.type === 'Array') {
    return contractParameter.value.some(item => toBoolean(item));
  }

  return toByteArrayBuffer(contractParameter).some(value => value !== 0);
};

const toString = (contractParameter: ContractParameter): string => {
  if (contractParameter.type === 'String') {
    return contractParameter.value;
  } else if (contractParameter.type === 'ByteArray') {
    return JSONHelper.readBuffer(contractParameter.value).toString('utf8');
  }

  throw new InvalidContractParameterError(contractParameter, [
    'String',
    'ByteArray',
  ]);
};

const toHash160 = (contractParameter: ContractParameter): Hash160String => {
  if (contractParameter.type === 'Hash160') {
    return contractParameter.value;
  } else if (contractParameter.type === 'ByteArray') {
    return JSONHelper.writeUInt160(
      common.bufferToUInt160(JSONHelper.readBuffer(contractParameter.value)),
    );
  }

  throw new InvalidContractParameterError(contractParameter, [
    'Hash160',
    'ByteArray',
  ]);
};

const toHash256 = (contractParameter: ContractParameter): Hash256String => {
  if (contractParameter.type === 'Hash256') {
    return contractParameter.value;
  } else if (contractParameter.type === 'ByteArray') {
    return JSONHelper.writeUInt256(
      common.bufferToUInt256(JSONHelper.readBuffer(contractParameter.value)),
    );
  }

  throw new InvalidContractParameterError(contractParameter, [
    'Hash256',
    'ByteArray',
  ]);
};

const toPublicKey = (contractParameter: ContractParameter): PublicKeyString => {
  if (contractParameter.type === 'PublicKey') {
    return contractParameter.value;
  } else if (contractParameter.type === 'ByteArray') {
    return common.ecPointToString(
      JSONHelper.readECPoint(contractParameter.value),
    );
  }

  throw new InvalidContractParameterError(contractParameter, [
    'PublicKey',
    'ByteArray',
  ]);
};

const toInteger = (
  contractParameter: ContractParameter,
  parameter: IntegerABI,
): BigNumber => {
  let value;
  if (contractParameter.type === 'Integer') {
    // eslint-disable-next-line
    value = contractParameter.value;
  } else if (contractParameter.type === 'ByteArray') {
    value = utils.fromSignedBuffer(
      JSONHelper.readBuffer(contractParameter.value),
    );
  } else {
    throw new InvalidContractParameterError(contractParameter, [
      'Integer',
      'ByteArray',
    ]);
  }

  return common.fixedToDecimal(value, parameter.decimals);
};

const toSignature = (contractParameter: ContractParameter): SignatureString => {
  if (contractParameter.type === 'Signature') {
    return contractParameter.value;
  }

  throw new InvalidContractParameterError(contractParameter, ['Signature']);
};

const toArray = (
  contractParameter: ContractParameter,
  parameter: ArrayABI,
): Array<?Param> => {
  if (contractParameter.type !== 'Array') {
    throw new InvalidContractParameterError(contractParameter, ['Array']);
  }

  const { value } = parameter;
  // eslint-disable-next-line
  const converter = contractParameters[value.type];
  return contractParameter.value.map(val =>
    converter(val, (value: $FlowFixMe)),
  );
};

const toInteropInterface = (
  // eslint-disable-next-line
  contractParameter: ContractParameter,
): typeof undefined => undefined;

const toVoid = (
  // eslint-disable-next-line
  contractParameter: ContractParameter,
): typeof undefined => undefined;

function createNullable<Result>(
  func: (contractParameter: ContractParameter) => Result,
): (contractParameter: ContractParameter) => ?Result {
  return contractParameter => {
    try {
      return func(contractParameter);
    } catch (error) {
      if (
        error.code === 'INVALID_CONTRACT_PARAMETER' ||
        error.code === 'INVALID_CONTRACT_PARAMETER_TYPE_JSON'
      ) {
        throw error;
      }

      return null;
    }
  };
}

function createNullableABI<Result, ABI>(
  func: (contractParameter: ContractParameter, parameter: ABI) => Result,
): (contractParameter: ContractParameter, parameter: ABI) => ?Result {
  return (contractParameter, parameter) => {
    try {
      return func(contractParameter, parameter);
    } catch (error) {
      if (
        error.code === 'INVALID_CONTRACT_PARAMETER' ||
        error.code === 'INVALID_CONTRACT_PARAMETER_TYPE_JSON'
      ) {
        throw error;
      }

      return null;
    }
  };
}

const toStringNullable = (createNullable(toString): (
  param: ContractParameter,
) => ?string);
const toHash160Nullable = (createNullable(toHash160): (
  param: ContractParameter,
) => ?Hash160String);
const toHash256Nullable = (createNullable(toHash256): (
  param: ContractParameter,
) => ?Hash256String);
const toPublicKeyNullable = (createNullable(toPublicKey): (
  param: ContractParameter,
) => ?PublicKeyString);
const toIntegerNullable = (createNullableABI(toInteger): (
  param: ContractParameter,
  abi: IntegerABI,
) => ?BigNumber);
const toBooleanNullable = (createNullable(toBoolean): (
  param: ContractParameter,
) => ?boolean);
const toSignatureNullable = (createNullable(toSignature): (
  param: ContractParameter,
) => ?SignatureString);
const toByteArrayNullable = (createNullable(toByteArray): (
  param: ContractParameter,
) => ?BufferString);
const toArrayNullable = (createNullableABI(toArray): (
  param: ContractParameter,
  abi: ArrayABI,
) => ?Array<?Param>);
const toInteropInterfaceNullable = (createNullable(toInteropInterface): (
  param: ContractParameter,
) => ?typeof undefined);
const toVoidNullable = (createNullable(toVoid): (
  param: ContractParameter,
) => ?typeof undefined);

const contractParameters = {
  String: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: StringABI,
  ): ?Param => toStringNullable(contractParameter),
  Hash160: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: Hash160ABI,
  ): ?Param => toHash160Nullable(contractParameter),
  Hash256: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: Hash256ABI,
  ): ?Param => toHash256Nullable(contractParameter),
  PublicKey: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: PublicKeyABI,
  ): ?Param => toPublicKeyNullable(contractParameter),
  Integer: (
    contractParameter: ContractParameter,
    parameter: IntegerABI,
  ): ?Param => toIntegerNullable(contractParameter, parameter),
  Boolean: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: BooleanABI,
  ): ?Param => toBooleanNullable(contractParameter),
  Signature: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: SignatureABI,
  ): ?Param => toSignatureNullable(contractParameter),
  ByteArray: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: ByteArrayABI,
  ): ?Param => toByteArrayNullable(contractParameter),
  Array: (contractParameter: ContractParameter, parameter: ArrayABI): ?Param =>
    toArrayNullable(contractParameter, parameter),
  InteropInterface: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: InteropInterfaceABI,
  ): ?Param => toInteropInterfaceNullable(contractParameter),
  Void: (
    contractParameter: ContractParameter,
    // eslint-disable-next-line
    parameter: VoidABI,
  ): ?Param => toVoidNullable(contractParameter),
};

export const converters = {
  toString,
  toStringNullable,
  toHash160,
  toHash160Nullable,
  toHash256,
  toHash256Nullable,
  toPublicKey,
  toPublicKeyNullable,
  toInteger,
  toIntegerNullable,
  toBoolean,
  toBooleanNullable,
  toSignature,
  toSignatureNullable,
  toByteArray,
  toByteArrayNullable,
  toArray,
  toArrayNullable,
  toInteropInterface,
  toInteropInterfaceNullable,
  toVoid,
  toVoidNullable,
};

export default contractParameters;
