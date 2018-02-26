/* @flow */
import BigNumber from 'bignumber.js';

import _ from 'lodash';
import { common } from '@neo-one/client-core';

import type {
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
import { InvalidArgumentError, InvalidNamedArgumentError } from './errors';

import { addressToScriptHash } from './helpers';
import converters from './user/converters';

export const assertString = (name: string, param: mixed): string => {
  if (param == null || typeof param !== 'string') {
    throw new InvalidArgumentError(
      `Expected string for ${name}, found: ${String(param)}`,
    );
  }

  return param;
};

export const assertNullableString = (name: string, param?: mixed): ?string => {
  if (param == null) {
    return param;
  }

  return assertString(name, param);
};

export const assertAddress = (address: mixed): AddressString => {
  if (address == null || typeof address !== 'string') {
    throw new InvalidArgumentError(
      `Address argument was not a string: ${String(address)}`,
    );
  }

  try {
    addressToScriptHash(address);
  } catch (error) {
    throw new InvalidArgumentError(`Invalid address: ${address}`);
  }

  return address;
};

export const assertHash160 = (hash: mixed): Hash160String => {
  const value = assertString('Hash160', hash);

  if (!value.startsWith('0x')) {
    throw new InvalidArgumentError(
      `Hash160 must start with '0x', found: ${String(hash)}`,
    );
  }

  try {
    common.stringToUInt160(value);
  } catch (error) {
    throw new InvalidArgumentError(
      `Invalid Hash160 param, found: ${String(hash)}`,
    );
  }

  return value;
};

export const assertHash256 = (hash: mixed): Hash256String => {
  const value = assertString('Hash256', hash);

  if (!value.startsWith('0x')) {
    throw new InvalidArgumentError(
      `Hash256 must start with '0x', found: ${String(hash)}`,
    );
  }

  try {
    common.stringToUInt256(value);
  } catch (error) {
    throw new InvalidArgumentError(
      `Invalid Hash256 param, found: ${String(hash)}`,
    );
  }

  return value;
};

export const assertBuffer = (buffer: mixed): BufferString => {
  const value = assertString('Buffer', buffer);
  if (Buffer.from(value, 'hex').toString('hex') !== value.toLowerCase()) {
    throw new InvalidArgumentError(
      `Expected hex string, found: ${String(buffer)}`,
    );
  }

  return value;
};

export const assertPublicKey = (publicKey: mixed): PublicKeyString => {
  const value = assertBuffer(publicKey);
  try {
    common.stringToECPoint(value);
    return value;
  } catch (error) {
    throw new InvalidArgumentError(
      `Expected PublicKey, found: ${String(publicKey)}`,
    );
  }
};

export const assertBigNumber = (value: mixed): BigNumber => {
  if (value == null || !BigNumber.isBigNumber(value)) {
    throw new InvalidArgumentError(
      `Expected BigNumber, found: ${String(value)}`,
    );
  }

  return (value: $FlowFixMe);
};

export const assertNullableBigNumber = (value: mixed): ?BigNumber => {
  if (value == null) {
    return value;
  }

  return assertBigNumber(value);
};

export const assertBoolean = (value: mixed): boolean => {
  if (value == null || typeof value !== 'boolean') {
    throw new InvalidArgumentError(`Expected boolean, found: ${String(value)}`);
  }

  return value;
};

export const assertNumber = (value: mixed): number => {
  if (value == null || typeof value !== 'number') {
    throw new InvalidArgumentError(`Expected number, found: ${String(value)}`);
  }

  return value;
};

export const assertNullableNumber = (value: mixed): ?number => {
  if (value != null && typeof value !== 'number') {
    throw new InvalidArgumentError(`Expected number, found: ${String(value)}`);
  }

  return value;
};

export const assertArray = (value: mixed): Array<mixed> => {
  if (!Array.isArray(value)) {
    throw new InvalidArgumentError(`Expected Array, found: ${String(value)}`);
  }

  return value;
};

export const assertBlockFilter = (filter: mixed): ?BlockFilter => {
  if (filter == null) {
    return filter;
  }

  if (typeof filter !== 'object') {
    throw new InvalidArgumentError(
      `Invalid BlockFilter param, found: ${String(filter)}`,
    );
  }

  if (_.isEmpty(filter)) {
    return ({}: $FlowFixMe);
  }

  if (filter.indexStart != null && typeof filter.indexStart !== 'number') {
    throw new InvalidArgumentError(
      `Invalid BlockFilter param, found: ${String(filter)}`,
    );
  }

  if (filter.indexStop != null && typeof filter.indexStop !== 'number') {
    throw new InvalidArgumentError(
      `Invalid BlockFilter param, found: ${String(filter)}`,
    );
  }

  if (
    filter.indexStart != null &&
    filter.indexStop != null &&
    filter.indexStart > filter.indexStop
  ) {
    throw new InvalidArgumentError(
      `Invalid BlockFilter param, found: ${String(filter)}`,
    );
  }

  return (filter: $FlowFixMe);
};

export const assertGetOptions = (options: mixed): ?GetOptions => {
  if (options == null) {
    return options;
  }

  if (typeof options !== 'object') {
    throw new InvalidArgumentError(
      `Invalid GetOptions param, found: ${String(options)}`,
    );
  }

  if (_.isEmpty(options)) {
    return ({}: $FlowFixMe);
  }

  if (options.timeout != null && typeof options.timeout !== 'number') {
    throw new InvalidArgumentError(
      `Invalid GetOptions param, found: ${String(options)}`,
    );
  }

  return (options: $FlowFixMe);
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

export const assertABIReturn = (value: mixed): ABIReturn => {
  if (value == null || typeof value !== 'object') {
    throw new InvalidArgumentError(
      `Invalid ABI return, found: ${String(value)}`,
    );
  }

  if (!ABI_TYPES.has(value.type)) {
    throw new InvalidArgumentError(
      `Invalid ABI return, found: ${String(value)}`,
    );
  }

  if (value.type === 'Array') {
    assertABIReturn(value.value);
  } else if (value.type === 'Integer') {
    assertNumber(value.decimals);
  }

  return (value: $FlowFixMe);
};

export const assertABIParameter = (value: mixed): ABIParameter => {
  if (value == null || typeof value !== 'object') {
    throw new InvalidArgumentError(
      `Invalid ABI parameter, found: ${String(value)}`,
    );
  }

  assertString('name', value.name);
  assertABIReturn(value);
  return (value: $FlowFixMe);
};

export const assertABIFunction = (value: mixed): ABIFunction => {
  if (value == null || typeof value !== 'object') {
    throw new InvalidArgumentError(
      `Invalid ABI function, found: ${String(value)}`,
    );
  }

  assertString('name', value.name);
  if (value.constant != null) {
    assertBoolean(value.constant);
  }

  if (value.parameters != null) {
    assertArray(value.parameters).map(parameter =>
      assertABIParameter(parameter),
    );
  }

  assertABIReturn(value.returnType);

  return (value: $FlowFixMe);
};

export const assertABIEvent = (value: mixed): ABIEvent => {
  if (value == null || typeof value !== 'object') {
    throw new InvalidArgumentError(
      `Invalid ABI event, found: ${String(value)}`,
    );
  }

  assertString('name', value.name);
  assertArray(value.parameters).map(parameter => assertABIParameter(parameter));

  return (value: $FlowFixMe);
};

export const assertABI = (abi: mixed): ABI => {
  if (abi == null || typeof abi !== 'object') {
    throw new InvalidArgumentError(`Invalid ABI param, found: ${String(abi)}`);
  }

  assertArray(abi.functions).map(value => assertABIFunction(value));
  if (abi.events != null) {
    assertArray(abi.events).map(event => assertABIEvent(event));
  }

  return (abi: $FlowFixMe);
};

export const assertAttributeArg = (attribute?: mixed): AttributeArg => {
  try {
    converters.attribute((attribute: $FlowFixMe));
    return (attribute: $FlowFixMe);
  } catch (error) {
    throw new InvalidNamedArgumentError('AttributeArg', attribute);
  }
};

export const assertTransactionOptions = (
  options?: mixed,
): ?TransactionOptions => {
  if (options == null) {
    return options;
  }

  if (typeof options !== 'object') {
    throw new InvalidNamedArgumentError('TransactionOptions', options);
  }
  // TODO: Fixme
  // assertNullableString('TransactionOptions', options.from);
  if (options.attributes != null) {
    if (!Array.isArray(options.attributes)) {
      throw new InvalidNamedArgumentError('TransactionOptions', options);
    }
    options.attributes.forEach(attribute => {
      assertAttributeArg(attribute);
    });
  }

  assertNullableBigNumber(options.networkFee);

  return (options: $FlowFixMe);
};
