// tslint:disable no-any
import { assertAssetType, assertContractParameterType, common } from '@neo-one/client-core';
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
  AssetRegister,
  AttributeArg,
  BlockFilter,
  BufferString,
  ContractRegister,
  GetOptions,
  Hash160String,
  Hash256String,
  NetworkType,
  PublicKeyString,
  SmartContractDefinition,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
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

const assertStringSimple = (value?: any) => {
  if (typeof value === 'string') {
    return value;
  }
  throw new InvalidArgumentError(`Expected string, found: ${value}`);
};

// new general Type-based assert functions
export const assertAssetRegister = (register?: any): AssetRegister => {
  try {
    assertAssetType(register.assetType);
    assertStringSimple(register.name);
    assertBigNumber(register.amount);
    assertNumber(register.precision);
    assertPublicKey(register.owner);
    assertAddress(register.admin);
    assertAddress(register.issuer);
  } catch (e) {
    throw new InvalidNamedArgumentError(`AssetRegister`, e);
  }

  return register;
};

export const assertContractRegister = (register?: any): ContractRegister => {
  try {
    assertBuffer(register.script);
    register.parameters.forEach(assertContractParameterType);
    assertContractParameterType(register.returnType);
    assertStringSimple(register.name);
    assertStringSimple(register.codeVersion);
    assertStringSimple(register.author);
    assertStringSimple(register.email);
    assertStringSimple(register.description);
    assertBoolean(register.properties.storage);
    assertBoolean(register.properties.dynamicInvoke);
    assertBoolean(register.properties.payable);
  } catch (e) {
    throw new InvalidNamedArgumentError(`ContractRegister`, e);
  }

  return register;
};

export const assertSmartContractDefinition = (definition?: any): SmartContractDefinition => {
  try {
    Object.values(definition.networks).forEach((network: any) => assertHash160(network.hash));
    assertABI(definition.abi);
  } catch (e) {
    throw new InvalidNamedArgumentError(`SmartContractDefinition`, e);
  }

  return definition;
};

export const assertTransactionReceipt = (receipt?: any): TransactionReceipt => {
  try {
    assertNumber(receipt.blockIndex);
    assertHash256(receipt.blockHash);
    assertNumber(receipt.transactionIndex);
  } catch (e) {
    throw new InvalidNamedArgumentError(`TransactionReceipt`, e);
  }

  return receipt;
};

export const assertTransactionResult = (result?: any): TransactionResult<TransactionReceipt> => {
  try {
    assertTransactionReceipt(result.receipt);
  } catch (e) {
    throw new InvalidNamedArgumentError(`TransactionResult`, e);
  }

  return result;
};

export const assertTransfer = (transfer?: any): Transfer => {
  try {
    assertBigNumber(transfer.amount);
    assertHash256(transfer.asset);
    assertAddress(transfer.to);
  } catch (e) {
    throw new InvalidNamedArgumentError(`Transfer`, e);
  }

  return transfer;
};

export const assertTransfers = (args?: ReadonlyArray<any>): any => {
  if (args === undefined) {
    throw new InvalidArgumentError('getTransfersOptions undefined args');
  }
  try {
    if (args.length >= 3) {
      assertBigNumber(args[0]);
      assertHash256(args[1]);
      assertAddress(args[2]);
      assertTransactionOptions(args[3]);
    } else {
      Object.values(args[0]).forEach(assertTransfer);
      assertTransactionOptions(args[1]);
    }
  } catch (e) {
    throw new InvalidNamedArgumentError(`Transfers`, e);
  }

  return args;
};

export const assertUpdateAccountNameOptions = (options?: any): UpdateAccountNameOptions => {
  try {
    assertUserAccountID(options.id);
    assertStringSimple(options.name);
  } catch (e) {
    throw new InvalidNamedArgumentError(`UpdateAccountNameOptions`, e);
  }

  return options;
};

export const assertUserAccount = (account?: any): UserAccount => {
  try {
    assertStringSimple(account.type);
    assertUserAccountID(account.id);
    assertStringSimple(account.name);
    assertHash160(account.scriptHash);
    assertPublicKey(account.publicKey);
    assertBoolean(account.configurableName);
    assertBoolean(account.deletable);
  } catch (e) {
    throw new InvalidNamedArgumentError(`UserAccount`, e);
  }

  return account;
};

export const assertUserAccountID = (ID?: any): UserAccountID => {
  try {
    assertNetworkType(ID.network);
    assertAddress(ID.address);
  } catch (e) {
    throw new InvalidNamedArgumentError(`UserAccountID`, e);
  }

  return ID;
};

export const assertNetworkType = (network?: any): NetworkType => {
  try {
    assertStringSimple(network);
  } catch {
    throw new InvalidArgumentError(`Expected network string, found: ${network}`);
  }

  return network;
};
