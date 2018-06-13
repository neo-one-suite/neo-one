import { common, JSONHelper, utils } from '@neo-one/client-core';
import { utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { InvalidContractParameterError } from '../errors';
import {
  ArrayABI,
  BooleanABI,
  BufferString,
  ByteArrayABI,
  ContractParameter,
  Hash160ABI,
  Hash160String,
  Hash256ABI,
  Hash256String,
  IntegerABI,
  InteropInterfaceABI,
  Param,
  PublicKeyABI,
  PublicKeyString,
  SignatureABI,
  SignatureString,
  StringABI,
  VoidABI,
} from '../types';

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
      commonUtils.assertNever(contractParameter);
      throw new Error('For Flow');
  }

  return value;
};

const toByteArray = (contractParameter: ContractParameter): BufferString =>
  toByteArrayBuffer(contractParameter).toString('hex');

const toBoolean = (contractParameter: ContractParameter): boolean => {
  if (contractParameter.type === 'Array') {
    return contractParameter.value.some((item) => toBoolean(item));
  }

  return toByteArrayBuffer(contractParameter).some((value) => value !== 0);
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
): Array<Param | null> => {
  if (contractParameter.type !== 'Array') {
    throw new InvalidContractParameterError(contractParameter, ['Array']);
  }

  const { value } = parameter;
  const converter = contractParameters[value.type] as any;
  return contractParameter.value.map((val) => converter(val, value));
};

const toInteropInterface = (contractParameter: ContractParameter): undefined =>
  undefined;

const toVoid = (contractParameter: ContractParameter): undefined => undefined;

function createNullable<Result>(
  func: (contractParameter: ContractParameter) => Result,
): (contractParameter: ContractParameter) => Result | null {
  return (contractParameter) => {
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
): (contractParameter: ContractParameter, parameter: ABI) => Result | null {
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

const toStringNullable = createNullable(toString) as (
  param: ContractParameter,
) => string | null;

const toHash160Nullable = createNullable(toHash160) as (
  param: ContractParameter,
) => Hash160String | null;
const toHash256Nullable = createNullable(toHash256) as (
  param: ContractParameter,
) => Hash256String | null;
const toPublicKeyNullable = createNullable(toPublicKey) as (
  param: ContractParameter,
) => PublicKeyString | null;
const toIntegerNullable = createNullableABI(toInteger) as (
  param: ContractParameter,
  abi: IntegerABI,
) => BigNumber | null;
const toBooleanNullable = createNullable(toBoolean) as (
  param: ContractParameter,
) => boolean | null;

const toSignatureNullable = createNullable(toSignature) as (
  param: ContractParameter,
) => SignatureString | null;
const toByteArrayNullable = createNullable(toByteArray) as (
  param: ContractParameter,
) => BufferString | null;
const toArrayNullable = createNullableABI(toArray) as (
  param: ContractParameter,
  abi: ArrayABI,
) => Array<Param | null> | null;
const toInteropInterfaceNullable = createNullable(toInteropInterface) as (
  param: ContractParameter,
) => undefined | null;
const toVoidNullable = createNullable(toVoid) as (
  param: ContractParameter,
) => undefined | null;

export const contractParameters = {
  String: (
    contractParameter: ContractParameter,
    parameter: StringABI,
  ): Param | null | undefined => toStringNullable(contractParameter),
  Hash160: (
    contractParameter: ContractParameter,
    parameter: Hash160ABI,
  ): Param | null | undefined => toHash160Nullable(contractParameter),
  Hash256: (
    contractParameter: ContractParameter,
    parameter: Hash256ABI,
  ): Param | null | undefined => toHash256Nullable(contractParameter),
  PublicKey: (
    contractParameter: ContractParameter,
    parameter: PublicKeyABI,
  ): Param | null | undefined => toPublicKeyNullable(contractParameter),
  Integer: (
    contractParameter: ContractParameter,
    parameter: IntegerABI,
  ): Param | null | undefined =>
    toIntegerNullable(contractParameter, parameter),
  Boolean: (
    contractParameter: ContractParameter,
    parameter: BooleanABI,
  ): Param | null | undefined => toBooleanNullable(contractParameter),
  Signature: (
    contractParameter: ContractParameter,
    parameter: SignatureABI,
  ): Param | null | undefined => toSignatureNullable(contractParameter),
  ByteArray: (
    contractParameter: ContractParameter,
    parameter: ByteArrayABI,
  ): Param | null | undefined => toByteArrayNullable(contractParameter),
  Array: (
    contractParameter: ContractParameter,
    parameter: ArrayABI,
  ): Param | null | undefined => toArrayNullable(contractParameter, parameter),
  InteropInterface: (
    contractParameter: ContractParameter,
    parameter: InteropInterfaceABI,
  ): Param | null | undefined => toInteropInterfaceNullable(contractParameter),
  Void: (
    contractParameter: ContractParameter,
    parameter: VoidABI,
  ): Param | null | undefined => toVoidNullable(contractParameter),
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
