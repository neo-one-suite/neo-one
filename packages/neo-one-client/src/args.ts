// tslint:disable no-any
import { common } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { InvalidArgumentError, InvalidNamedArgumentError } from './errors';
import { addressToScriptHash } from './helpers';
import {
  ABI,
  ABIEvent,
  ABIFunction,
  ABIParameter,
  ABIReturn,
  AddressString,
  AttributeArg,
  BlockFilter,
  BufferString,
  GetOptions,
  Hash160String,
  Hash256String,
  PublicKeyString,
  TransactionOptions,
} from './types';
import { converters } from './user/converters';

export const assertString = (name: string, param: any): string => {
  if (param == undefined || typeof param !== 'string') {
    throw new InvalidArgumentError(`Expected string for ${name}, found: ${String(param)}`);
  }

  return param;
};

export const assertNullableString = (name: string, param?: any): string | undefined => {
  if (param == undefined) {
    return undefined;
  }

  return assertString(name, param);
};

export const assertAddress = (address: any): AddressString => {
  if (address == undefined || typeof address !== 'string') {
    throw new InvalidArgumentError(`Address argument was not a string: ${String(address)}`);
  }

  try {
    addressToScriptHash(address);
  } catch {
    throw new InvalidArgumentError(`Invalid address: ${address}`);
  }

  return address;
};

export const assertHash160 = (hash: any): Hash160String => {
  const value = assertString('Hash160', hash);

  if (!value.startsWith('0x')) {
    throw new InvalidArgumentError(`Hash160 must start with '0x', found: ${String(hash)}`);
  }

  try {
    common.stringToUInt160(value);
  } catch {
    throw new InvalidArgumentError(`Invalid Hash160 param, found: ${String(hash)}`);
  }

  return value;
};

export const assertHash256 = (hash: any): Hash256String => {
  const value = assertString('Hash256', hash);

  if (!value.startsWith('0x')) {
    throw new InvalidArgumentError(`Hash256 must start with '0x', found: ${String(hash)}`);
  }

  try {
    common.stringToUInt256(value);
  } catch {
    throw new InvalidArgumentError(`Invalid Hash256 param, found: ${String(hash)}`);
  }

  return value;
};

export const assertBuffer = (buffer: any): BufferString => {
  const value = assertString('Buffer', buffer);
  if (Buffer.from(value, 'hex').toString('hex') !== value.toLowerCase()) {
    throw new InvalidArgumentError(`Expected hex string, found: ${String(buffer)}`);
  }

  return value;
};

export const assertPublicKey = (publicKey: any): PublicKeyString => {
  const value = assertBuffer(publicKey);
  try {
    common.stringToECPoint(value);

    return value;
  } catch {
    throw new InvalidArgumentError(`Expected PublicKey, found: ${String(publicKey)}`);
  }
};

export const assertBigNumber = (value: any): BigNumber => {
  if (value == undefined || !BigNumber.isBigNumber(value)) {
    throw new InvalidArgumentError(`Expected BigNumber, found: ${String(value)}`);
  }

  return value;
};

export const assertNullableBigNumber = (value: any): BigNumber | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertBigNumber(value);
};

export const assertBoolean = (value: any): boolean => {
  if (value == undefined || typeof value !== 'boolean') {
    throw new InvalidArgumentError(`Expected boolean, found: ${String(value)}`);
  }

  return value;
};

export const assertNumber = (value: any): number => {
  if (value == undefined || typeof value !== 'number') {
    throw new InvalidArgumentError(`Expected number, found: ${String(value)}`);
  }

  return value;
};

export const assertNullableNumber = (value: any): number | undefined => {
  if (value != undefined && typeof value !== 'number') {
    throw new InvalidArgumentError(`Expected number, found: ${String(value)}`);
  }

  return value == undefined ? undefined : value;
};

export const assertArray = (value: any): ReadonlyArray<{}> => {
  if (!Array.isArray(value)) {
    throw new InvalidArgumentError(`Expected Array, found: ${String(value)}`);
  }

  return value;
};

export const assertBlockFilter = (filter: any): BlockFilter | undefined => {
  if (filter == undefined) {
    return undefined;
  }

  if (typeof filter !== 'object') {
    throw new InvalidArgumentError(`Invalid BlockFilter param, found: ${String(filter)}`);
  }

  if (_.isEmpty(filter)) {
    return {} as any;
  }

  if (filter.indexStart != undefined && typeof filter.indexStart !== 'number') {
    throw new InvalidArgumentError(`Invalid BlockFilter param, found: ${String(filter)}`);
  }

  if (filter.indexStop != undefined && typeof filter.indexStop !== 'number') {
    throw new InvalidArgumentError(`Invalid BlockFilter param, found: ${String(filter)}`);
  }

  if (filter.indexStart != undefined && filter.indexStop != undefined && filter.indexStart > filter.indexStop) {
    throw new InvalidArgumentError(`Invalid BlockFilter param, found: ${String(filter)}`);
  }

  return filter;
};

export const assertGetOptions = (options: any): GetOptions | undefined => {
  if (options == undefined) {
    return undefined;
  }

  if (typeof options !== 'object') {
    throw new InvalidArgumentError(`Invalid GetOptions param, found: ${String(options)}`);
  }

  if (_.isEmpty(options)) {
    return {} as any;
  }

  if (options.timeout != undefined && typeof options.timeout !== 'number') {
    throw new InvalidArgumentError(`Invalid GetOptions param, found: ${String(options)}`);
  }

  return options;
};

const ABI_TYPES = new Set([
  'Signature',
  'Boolean',
  'Hash160',
  'Hash256',
  'ByteArray',
  'PublicKey',
  'String',
  'InteropInterface',
  'Void',
  'Integer',
  'Array',
]);

export const assertABIReturn = (value: any): ABIReturn => {
  if (value == undefined || typeof value !== 'object') {
    throw new InvalidArgumentError(`Invalid ABI return, found: ${String(value)}`);
  }

  if (!ABI_TYPES.has(value.type)) {
    throw new InvalidArgumentError(`Invalid ABI return, found: ${String(value)}`);
  }

  if (value.type === 'Array') {
    assertABIReturn(value.value);
  } else if (value.type === 'Integer') {
    assertNumber(value.decimals);
  }

  return value;
};

export const assertABIParameter = (value: any): ABIParameter => {
  if (value == undefined || typeof value !== 'object') {
    throw new InvalidArgumentError(`Invalid ABI parameter, found: ${String(value)}`);
  }

  assertString('name', value.name);
  assertABIReturn(value);

  return value;
};

export const assertABIFunction = (value: any): ABIFunction => {
  if (value == undefined || typeof value !== 'object') {
    throw new InvalidArgumentError(`Invalid ABI function, found: ${String(value)}`);
  }

  assertString('name', value.name);
  if (value.constant != undefined) {
    assertBoolean(value.constant);
  }

  if (value.parameters != undefined) {
    assertArray(value.parameters).forEach(assertABIParameter);
  }

  assertABIReturn(value.returnType);

  return value;
};

export const assertABIEvent = (value: any): ABIEvent => {
  if (value == undefined || typeof value !== 'object') {
    throw new InvalidArgumentError(`Invalid ABI event, found: ${String(value)}`);
  }

  assertString('name', value.name);
  assertArray(value.parameters).forEach(assertABIParameter);

  return value;
};

export const assertABI = (abi: any): ABI => {
  if (abi == undefined || typeof abi !== 'object') {
    throw new InvalidArgumentError(`Invalid ABI param, found: ${String(abi)}`);
  }

  assertArray(abi.functions).forEach(assertABIFunction);
  if (abi.events != undefined) {
    assertArray(abi.events).forEach(assertABIEvent);
  }

  return abi;
};

export const assertAttributeArg = (attribute?: any): AttributeArg => {
  try {
    converters.attribute(attribute);

    return attribute;
  } catch {
    throw new InvalidNamedArgumentError('AttributeArg', attribute);
  }
};

export const assertTransactionOptions = (options?: any): TransactionOptions | undefined => {
  if (options == undefined) {
    return undefined;
  }

  if (typeof options !== 'object') {
    throw new InvalidNamedArgumentError('TransactionOptions', options);
  }

  const { from } = options;
  if (from != undefined) {
    if (typeof from !== 'object') {
      throw new InvalidNamedArgumentError('TransactionOptions', options);
    }
    assertString('TransactionOptions', from.network);
    assertString('TransactionOptions', from.address);
  }

  if (options.attributes != undefined) {
    if (!Array.isArray(options.attributes)) {
      throw new InvalidNamedArgumentError('TransactionOptions', options);
    }
    options.attributes.forEach((attribute: any) => {
      assertAttributeArg(attribute);
    });
  }

  assertNullableBigNumber(options.networkFee);

  return options;
};
