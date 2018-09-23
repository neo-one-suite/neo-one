import { utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { common } from './common';
import { crypto } from './crypto';
import { InvalidContractParameterError } from './errors';
import { JSONHelper } from './JSONHelper';
import {
  ABIReturn,
  AddressABI,
  AddressString,
  ArrayABI,
  BooleanABI,
  BufferABI,
  BufferString,
  ContractParameter,
  ForwardValueABI,
  Hash256ABI,
  Hash256String,
  IntegerABI,
  MapABI,
  ObjectABI,
  PublicKeyABI,
  PublicKeyString,
  Return,
  SignatureABI,
  SignatureString,
  StringABI,
  VoidABI,
} from './types';
import { utils } from './utils';

const toBufferBuffer = (contractParameter: ContractParameter): Buffer => {
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
    case 'Address':
      value = common.uInt160ToBuffer(
        crypto.addressToScriptHash({
          addressVersion: common.NEO_ADDRESS_VERSION,
          address: contractParameter.value,
        }),
      );
      break;
    case 'Hash256':
      value = common.uInt256ToBuffer(JSONHelper.readUInt256(contractParameter.value));
      break;
    case 'Buffer':
      value = JSONHelper.readBuffer(contractParameter.value);
      break;
    case 'PublicKey':
      value = common.ecPointToBuffer(JSONHelper.readECPoint(contractParameter.value));
      break;
    case 'String':
      value = Buffer.from(contractParameter.value, 'utf8');
      break;
    case 'Array':
    case 'Map':
      throw new InvalidContractParameterError(contractParameter, [
        'Signature',
        'Boolean',
        'Integer',
        'Address',
        'Hash256',
        'Buffer',
        'PublicKey',
        'String',
        'Void',
      ]);
    case 'InteropInterface':
      value = Buffer.alloc(0, 0);
      break;
    case 'Void':
      value = Buffer.alloc(0, 0);
      break;
    default:
      /* istanbul ignore next */
      commonUtils.assertNever(contractParameter);
      /* istanbul ignore next */
      throw new Error('For TS');
  }

  return value;
};

const toBuffer = (contractParameter: ContractParameter): BufferString =>
  toBufferBuffer(contractParameter).toString('hex');

const toBoolean = (contractParameter: ContractParameter): boolean => {
  if (contractParameter.type === 'Array') {
    return contractParameter.value.some(toBoolean);
  }

  return toBufferBuffer(contractParameter).some((value) => value !== 0);
};

const toString = (contractParameter: ContractParameter): string => {
  if (contractParameter.type === 'String') {
    return contractParameter.value;
  }

  if (contractParameter.type === 'Buffer') {
    return JSONHelper.readBuffer(contractParameter.value).toString('utf8');
  }

  throw new InvalidContractParameterError(contractParameter, ['String', 'Buffer']);
};

const toAddress = (contractParameter: ContractParameter): AddressString => {
  if (contractParameter.type === 'Address') {
    return contractParameter.value;
  }

  if (contractParameter.type === 'Buffer') {
    return crypto.scriptHashToAddress({
      scriptHash: common.bufferToUInt160(JSONHelper.readBuffer(contractParameter.value)),
      addressVersion: common.NEO_ADDRESS_VERSION,
    });
  }

  throw new InvalidContractParameterError(contractParameter, ['Address', 'Buffer']);
};

const toHash256 = (contractParameter: ContractParameter): Hash256String => {
  if (contractParameter.type === 'Hash256') {
    return contractParameter.value;
  }

  if (contractParameter.type === 'Buffer') {
    return JSONHelper.writeUInt256(common.bufferToUInt256(JSONHelper.readBuffer(contractParameter.value)));
  }

  throw new InvalidContractParameterError(contractParameter, ['Hash256', 'Buffer']);
};

const toPublicKey = (contractParameter: ContractParameter): PublicKeyString => {
  if (contractParameter.type === 'PublicKey') {
    return contractParameter.value;
  }

  if (contractParameter.type === 'Buffer') {
    return common.ecPointToString(JSONHelper.readECPoint(contractParameter.value));
  }

  throw new InvalidContractParameterError(contractParameter, ['PublicKey', 'Buffer']);
};

const toInteger = (contractParameter: ContractParameter, parameter: IntegerABI): BigNumber => {
  let value;
  if (contractParameter.type === 'Integer') {
    value = contractParameter.value;
  } else if (contractParameter.type === 'Buffer') {
    value = utils.fromSignedBuffer(JSONHelper.readBuffer(contractParameter.value));
  } else {
    throw new InvalidContractParameterError(contractParameter, ['Integer', 'Buffer']);
  }

  return common.fixedToDecimal(value, parameter.decimals);
};

const toSignature = (contractParameter: ContractParameter): SignatureString => {
  if (contractParameter.type === 'Signature') {
    return contractParameter.value;
  }

  if (contractParameter.type === 'Buffer' && contractParameter.value.length === 128) {
    return contractParameter.value;
  }

  throw new InvalidContractParameterError(contractParameter, ['Signature']);
};

const toArray = (contractParameter: ContractParameter, parameter: ArrayABI): ReadonlyArray<Return> => {
  if (contractParameter.type !== 'Array') {
    throw new InvalidContractParameterError(contractParameter, ['Array']);
  }

  const { value } = parameter;
  // tslint:disable-next-line no-any
  const converter = contractParameters[value.type] as any;

  return contractParameter.value.map((val) => converter(val, value));
};

const toMap = (contractParameter: ContractParameter, parameter: MapABI): ReadonlyMap<Return, Return> => {
  if (contractParameter.type !== 'Map') {
    throw new InvalidContractParameterError(contractParameter, ['Map']);
  }

  const { key, value } = parameter;
  // tslint:disable-next-line no-any
  const keyConverter = contractParameters[key.type] as any;
  // tslint:disable-next-line no-any
  const valueConverter = contractParameters[value.type] as any;

  return new Map(
    contractParameter.value.map<[Return | undefined, Return | undefined]>((val) => [
      keyConverter(val[0], key),
      valueConverter(val[1], value),
    ]),
  );
};

const toObject = (contractParameter: ContractParameter, parameter: ObjectABI): { readonly [key: string]: Return } => {
  if (contractParameter.type !== 'Map') {
    throw new InvalidContractParameterError(contractParameter, ['Map']);
  }

  return contractParameter.value.reduce<{ readonly [key: string]: Return }>((acc, [keyParam, val]) => {
    const key = toString(keyParam);
    const value = parameter.properties[key] as ABIReturn | undefined;
    if (value === undefined) {
      throw new InvalidContractParameterError(contractParameter, ['Map']);
    }
    // tslint:disable-next-line no-any
    const converter = contractParameters[value.type] as any;

    return {
      ...acc,
      [key]: converter(val, value),
    };
  }, {});
};

const toInteropInterface = (_contractParameter: ContractParameter): undefined => undefined;

const toVoid = (_contractParameter: ContractParameter): undefined => undefined;

const toForwardValue = (contractParameter: ContractParameter): ContractParameter => contractParameter;

function wrapNullable<Result>(
  func: (contractParameter: ContractParameter) => Result,
): (contractParameter: ContractParameter) => Result | undefined {
  return (contractParameter) => {
    try {
      if (contractParameter.type === 'Buffer' && contractParameter.value.length === 0) {
        return undefined;
      }

      if (contractParameter.type === 'Void') {
        return undefined;
      }

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
      if (contractParameter.type === 'Buffer' && contractParameter.value.length === 0) {
        return undefined;
      }

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

const toAddressNullable = wrapNullable(toAddress) as (param: ContractParameter) => AddressString | undefined;
const toHash256Nullable = wrapNullable(toHash256) as (param: ContractParameter) => Hash256String | undefined;
const toPublicKeyNullable = wrapNullable(toPublicKey) as (param: ContractParameter) => PublicKeyString | undefined;
const toIntegerNullable = wrapNullableABI(toInteger) as (
  param: ContractParameter,
  abi: IntegerABI,
) => BigNumber | undefined;
const toBooleanNullable = wrapNullable(toBoolean) as (param: ContractParameter) => boolean | undefined;

const toSignatureNullable = wrapNullable(toSignature) as (param: ContractParameter) => SignatureString | undefined;
const toBufferNullable = wrapNullable(toBuffer) as (param: ContractParameter) => BufferString | undefined;
const toArrayNullable = wrapNullableABI(toArray) as (
  param: ContractParameter,
  abi: ArrayABI,
) => ReadonlyArray<Return | undefined> | undefined;
const toMapNullable = wrapNullableABI(toMap) as (
  param: ContractParameter,
  abi: MapABI,
) => ReadonlyMap<Return | undefined, Return | undefined> | undefined;
const toObjectNullable = wrapNullableABI(toObject) as (
  param: ContractParameter,
  abi: ObjectABI,
) => { readonly [key: string]: Return } | undefined;
const toInteropInterfaceNullable = wrapNullable(toInteropInterface) as (
  param: ContractParameter,
) => undefined | undefined;
const toVoidNullable = wrapNullable(toVoid) as (param: ContractParameter) => undefined | undefined;
const toForwardValueNullable = wrapNullable(toForwardValue) as (param: ContractParameter) => undefined | undefined;

export const contractParameters = {
  String: (contractParameter: ContractParameter, parameter: StringABI): Return | undefined =>
    parameter.optional ? toStringNullable(contractParameter) : toString(contractParameter),
  Address: (contractParameter: ContractParameter, parameter: AddressABI): Return | undefined =>
    parameter.optional ? toAddressNullable(contractParameter) : toAddress(contractParameter),
  Hash256: (contractParameter: ContractParameter, parameter: Hash256ABI): Return | undefined =>
    parameter.optional ? toHash256Nullable(contractParameter) : toHash256(contractParameter),
  PublicKey: (contractParameter: ContractParameter, parameter: PublicKeyABI): Return | undefined =>
    parameter.optional ? toPublicKeyNullable(contractParameter) : toPublicKey(contractParameter),
  Integer: (contractParameter: ContractParameter, parameter: IntegerABI): Return | undefined =>
    parameter.optional ? toIntegerNullable(contractParameter, parameter) : toInteger(contractParameter, parameter),
  Boolean: (contractParameter: ContractParameter, parameter: BooleanABI): Return | undefined =>
    parameter.optional ? toBooleanNullable(contractParameter) : toBoolean(contractParameter),
  Signature: (contractParameter: ContractParameter, parameter: SignatureABI): Return | undefined =>
    parameter.optional ? toSignatureNullable(contractParameter) : toSignature(contractParameter),
  Buffer: (contractParameter: ContractParameter, parameter: BufferABI): Return | undefined =>
    parameter.optional ? toBufferNullable(contractParameter) : toBuffer(contractParameter),
  Array: (contractParameter: ContractParameter, parameter: ArrayABI): Return | undefined =>
    parameter.optional ? toArrayNullable(contractParameter, parameter) : toArray(contractParameter, parameter),
  Map: (contractParameter: ContractParameter, parameter: MapABI): Return | undefined =>
    parameter.optional ? toMapNullable(contractParameter, parameter) : toMap(contractParameter, parameter),
  Object: (contractParameter: ContractParameter, parameter: ObjectABI): Return | undefined =>
    parameter.optional ? toObjectNullable(contractParameter, parameter) : toObject(contractParameter, parameter),
  Void: (contractParameter: ContractParameter, parameter: VoidABI): Return | undefined =>
    parameter.optional ? toVoidNullable(contractParameter) : toVoid(contractParameter),
  ForwardValue: (contractParameter: ContractParameter, parameter: ForwardValueABI): Return | undefined =>
    parameter.optional ? toForwardValueNullable(contractParameter) : toForwardValue(contractParameter),
};

export const smartContractConverters = {
  toString,
  toStringNullable,
  toAddress,
  toAddressNullable,
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
  toBuffer,
  toBufferNullable,
  toArray,
  toArrayNullable,
  toMap,
  toMapNullable,
  toObject,
  toObjectNullable,
  toInteropInterface,
  toInteropInterfaceNullable,
  toVoid,
  toVoidNullable,
  toForwardValue,
  toForwardValueNullable,
};
