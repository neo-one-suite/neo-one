import { utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { common } from './common';
import { InvalidContractParameterError } from './errors';
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
} from './types';
import { JSONHelper, utils } from './utils';

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
      value = common.uInt160ToBuffer(JSONHelper.readUInt160(contractParameter.value));
      break;
    case 'Hash256':
      value = common.uInt256ToBuffer(JSONHelper.readUInt256(contractParameter.value));
      break;
    case 'ByteArray':
      value = JSONHelper.readBuffer(contractParameter.value);
      break;
    case 'PublicKey':
      value = common.ecPointToBuffer(JSONHelper.readECPoint(contractParameter.value));
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
    return contractParameter.value.some(toBoolean);
  }

  return toByteArrayBuffer(contractParameter).some((value) => value !== 0);
};

const toString = (contractParameter: ContractParameter): string => {
  if (contractParameter.type === 'String') {
    return contractParameter.value;
  }

  if (contractParameter.type === 'ByteArray') {
    return JSONHelper.readBuffer(contractParameter.value).toString('utf8');
  }

  throw new InvalidContractParameterError(contractParameter, ['String', 'ByteArray']);
};

const toHash160 = (contractParameter: ContractParameter): Hash160String => {
  if (contractParameter.type === 'Hash160') {
    return contractParameter.value;
  }

  if (contractParameter.type === 'ByteArray') {
    return JSONHelper.writeUInt160(common.bufferToUInt160(JSONHelper.readBuffer(contractParameter.value)));
  }

  throw new InvalidContractParameterError(contractParameter, ['Hash160', 'ByteArray']);
};

const toHash256 = (contractParameter: ContractParameter): Hash256String => {
  if (contractParameter.type === 'Hash256') {
    return contractParameter.value;
  }

  if (contractParameter.type === 'ByteArray') {
    return JSONHelper.writeUInt256(common.bufferToUInt256(JSONHelper.readBuffer(contractParameter.value)));
  }

  throw new InvalidContractParameterError(contractParameter, ['Hash256', 'ByteArray']);
};

const toPublicKey = (contractParameter: ContractParameter): PublicKeyString => {
  if (contractParameter.type === 'PublicKey') {
    return contractParameter.value;
  }

  if (contractParameter.type === 'ByteArray') {
    return common.ecPointToString(JSONHelper.readECPoint(contractParameter.value));
  }

  throw new InvalidContractParameterError(contractParameter, ['PublicKey', 'ByteArray']);
};

const toInteger = (contractParameter: ContractParameter, parameter: IntegerABI): BigNumber => {
  let value;
  if (contractParameter.type === 'Integer') {
    value = contractParameter.value;
  } else if (contractParameter.type === 'ByteArray') {
    value = utils.fromSignedBuffer(JSONHelper.readBuffer(contractParameter.value));
  } else {
    throw new InvalidContractParameterError(contractParameter, ['Integer', 'ByteArray']);
  }

  return common.fixedToDecimal(value, parameter.decimals);
};

const toSignature = (contractParameter: ContractParameter): SignatureString => {
  if (contractParameter.type === 'Signature') {
    return contractParameter.value;
  }

  throw new InvalidContractParameterError(contractParameter, ['Signature']);
};

const toArray = (contractParameter: ContractParameter, parameter: ArrayABI): ReadonlyArray<Param | undefined> => {
  if (contractParameter.type !== 'Array') {
    throw new InvalidContractParameterError(contractParameter, ['Array']);
  }

  const { value } = parameter;
  // tslint:disable-next-line no-any
  const converter = contractParameters[value.type] as any;

  return contractParameter.value.map((val) => converter(val, value));
};

const toInteropInterface = (_contractParameter: ContractParameter): undefined => undefined;

const toVoid = (_contractParameter: ContractParameter): undefined => undefined;

function wrapNullable<Result>(
  func: (contractParameter: ContractParameter) => Result,
): (contractParameter: ContractParameter) => Result | undefined {
  return (contractParameter) => {
    try {
      return func(contractParameter);
    } catch (error) {
      if (error.code === 'INVALID_CONTRACT_PARAMETER' || error.code === 'INVALID_CONTRACT_PARAMETER_TYPE_JSON') {
        throw error as Error;
      }

      return undefined;
    }
  };
}

function wrapNullableABI<Result, ABI>(
  func: (contractParameter: ContractParameter, parameter: ABI) => Result,
): (contractParameter: ContractParameter, parameter: ABI) => Result | undefined {
  return (contractParameter, parameter) => {
    try {
      return func(contractParameter, parameter);
    } catch (error) {
      if (error.code === 'INVALID_CONTRACT_PARAMETER' || error.code === 'INVALID_CONTRACT_PARAMETER_TYPE_JSON') {
        throw error as Error;
      }

      return undefined;
    }
  };
}

const toStringNullable = wrapNullable(toString) as (param: ContractParameter) => string | undefined;

const toHash160Nullable = wrapNullable(toHash160) as (param: ContractParameter) => Hash160String | undefined;
const toHash256Nullable = wrapNullable(toHash256) as (param: ContractParameter) => Hash256String | undefined;
const toPublicKeyNullable = wrapNullable(toPublicKey) as (param: ContractParameter) => PublicKeyString | undefined;
const toIntegerNullable = wrapNullableABI(toInteger) as (
  param: ContractParameter,
  abi: IntegerABI,
) => BigNumber | undefined;
const toBooleanNullable = wrapNullable(toBoolean) as (param: ContractParameter) => boolean | undefined;

const toSignatureNullable = wrapNullable(toSignature) as (param: ContractParameter) => SignatureString | undefined;
const toByteArrayNullable = wrapNullable(toByteArray) as (param: ContractParameter) => BufferString | undefined;
const toArrayNullable = wrapNullableABI(toArray) as (
  param: ContractParameter,
  abi: ArrayABI,
) => ReadonlyArray<Param | undefined> | undefined;
const toInteropInterfaceNullable = wrapNullable(toInteropInterface) as (
  param: ContractParameter,
) => undefined | undefined;
const toVoidNullable = wrapNullable(toVoid) as (param: ContractParameter) => undefined | undefined;

export const contractParameters = {
  String: (contractParameter: ContractParameter, _parameter: StringABI): Param | undefined | undefined =>
    toStringNullable(contractParameter),
  Hash160: (contractParameter: ContractParameter, _parameter: Hash160ABI): Param | undefined | undefined =>
    toHash160Nullable(contractParameter),
  Hash256: (contractParameter: ContractParameter, _parameter: Hash256ABI): Param | undefined | undefined =>
    toHash256Nullable(contractParameter),
  PublicKey: (contractParameter: ContractParameter, _parameter: PublicKeyABI): Param | undefined | undefined =>
    toPublicKeyNullable(contractParameter),
  Integer: toIntegerNullable,
  Boolean: (contractParameter: ContractParameter, _parameter: BooleanABI): Param | undefined | undefined =>
    toBooleanNullable(contractParameter),
  Signature: (contractParameter: ContractParameter, _parameter: SignatureABI): Param | undefined | undefined =>
    toSignatureNullable(contractParameter),
  ByteArray: (contractParameter: ContractParameter, _parameter: ByteArrayABI): Param | undefined | undefined =>
    toByteArrayNullable(contractParameter),
  Array: toArrayNullable,
  InteropInterface: (
    contractParameter: ContractParameter,
    _parameter: InteropInterfaceABI,
  ): Param | undefined | undefined => toInteropInterfaceNullable(contractParameter),
  Void: (contractParameter: ContractParameter, _parameter: VoidABI): Param | undefined | undefined =>
    toVoidNullable(contractParameter),
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
