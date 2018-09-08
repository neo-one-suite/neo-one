// tslint:disable strict-type-predicates
import { assertAttributeUsageJSON, common, ForwardValue, Param, ScriptBuilderParam } from '@neo-one/client-core';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { InvalidArgumentError } from './errors';
import { addressToScriptHash, privateKeyToPublicKey, scriptHashToAddress, wifToPrivateKey } from './helpers';
import {
  ABI,
  ABIDefault,
  ABIDefaultType,
  ABIEvent,
  ABIFunction,
  ABIParameter,
  ABIReturn,
  AddressString,
  AssetRegister,
  AssetType,
  Attribute,
  AttributeUsage,
  BlockFilter,
  BufferString,
  ContractParameterType,
  ContractRegister,
  GetOptions,
  Hash256String,
  PrivateKeyString,
  PublicKeyString,
  ReadSmartContractDefinition,
  SmartContractDefinition,
  SmartContractNetworkDefinition,
  SmartContractNetworksDefinition,
  SourceMaps,
  TransactionOptions,
  Transfer,
  UpdateAccountNameOptions,
  UserAccountID,
} from './types';

export const assertString = (name: string, param?: unknown): string => {
  if (param == undefined || typeof param !== 'string') {
    throw new InvalidArgumentError('string', name, param);
  }

  return param;
};

export const assertNullableString = (name: string, param?: unknown): string | undefined => {
  if (param == undefined) {
    return undefined;
  }

  return assertString(name, param);
};

export const assertAddress = (name: string, addressIn?: unknown): AddressString => {
  const address = assertString(name, addressIn);

  try {
    addressToScriptHash(address);

    return address;
  } catch {
    try {
      return scriptHashToAddress(address);
    } catch {
      throw new InvalidArgumentError('Address', name, address);
    }
  }
};

export const assertHash256 = (name: string, hash?: unknown): Hash256String => {
  const value = assertString(name, hash);

  try {
    return common.uInt256ToString(common.stringToUInt256(value));
  } catch {
    throw new InvalidArgumentError('Hash256', name, value);
  }
};

export const assertBuffer = (name: string, buffer?: unknown): BufferString => {
  const value = assertString(name, buffer);
  if (Buffer.from(value, 'hex').toString('hex') !== value.toLowerCase()) {
    throw new InvalidArgumentError('Buffer', name, value);
  }

  return value;
};

export const assertPublicKey = (name: string, publicKey?: unknown): PublicKeyString => {
  const value = assertBuffer(name, publicKey);
  try {
    return common.ecPointToString(common.stringToECPoint(value));
  } catch {
    throw new InvalidArgumentError('PublicKey', name, value);
  }
};

export const assertBigNumber = (name: string, value?: unknown): BigNumber => {
  if (value == undefined || !BigNumber.isBigNumber(value)) {
    throw new InvalidArgumentError('BigNumber', name, value);
  }

  return value as BigNumber;
};

export const assertNullableBigNumber = (name: string, value?: unknown): BigNumber | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertBigNumber(name, value);
};

export const assertBoolean = (name: string, value?: unknown): boolean => {
  if (value == undefined || typeof value !== 'boolean') {
    throw new InvalidArgumentError('boolean', name, value);
  }

  return value;
};

export const assertNullableBoolean = (name: string, value?: unknown): boolean | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertBoolean(name, value);
};

export const assertNumber = (name: string, value?: unknown): number => {
  if (value == undefined || typeof value !== 'number') {
    throw new InvalidArgumentError('number', name, value);
  }

  return value;
};

export const assertNullableNumber = (name: string, value?: unknown): number | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertNumber(name, value);
};

export const assertArray = (name: string, value?: unknown): ReadonlyArray<unknown> => {
  if (!Array.isArray(value)) {
    throw new InvalidArgumentError('Array', name, value);
  }

  return value;
};

export const assertNullableArray = (name: string, value?: unknown): ReadonlyArray<unknown> => {
  if (value == undefined) {
    return [];
  }

  return assertArray(name, value);
};

const isObject = (value?: unknown): value is object => value != undefined && typeof value === 'object';
const assertProperty = <T, Name extends string, P>(
  value: T,
  objectName: string,
  name: Name,
  assertType: (name: string, v?: unknown) => P,
): P => {
  // tslint:disable-next-line no-any
  const valueAny: any = value;

  return assertType(`${objectName}.${name}`, valueAny[name]);
};

export const assertBlockFilter = (name: string, filter?: unknown): BlockFilter | undefined => {
  if (filter == undefined) {
    return undefined;
  }

  if (!isObject(filter)) {
    throw new InvalidArgumentError('BlockFilter', name, filter);
  }

  if (_.isEmpty(filter)) {
    return {};
  }

  const output = {
    indexStart: assertProperty(filter, 'BlockFilter', 'indexStart', assertNullableNumber),
    indexStop: assertProperty(filter, 'BlockFilter', 'indexStop', assertNullableNumber),
  };

  if (output.indexStart !== undefined && output.indexStop !== undefined && output.indexStart > output.indexStop) {
    throw new InvalidArgumentError(
      'BlockFilter',
      name,
      JSON.stringify(filter),
      'Index start was greater than index stop.',
    );
  }

  return output;
};

export const assertGetOptions = (name: string, options?: unknown): GetOptions | undefined => {
  if (options == undefined) {
    return undefined;
  }

  if (!isObject(options)) {
    throw new InvalidArgumentError('GetOptions', name, options);
  }

  if (_.isEmpty(options)) {
    return {};
  }

  return {
    timeoutMS: assertProperty(options, 'GetOptions', 'timeoutMS', assertNullableNumber),
  };
};

const assertAttributeUsage = (name: string, valueIn?: unknown): AttributeUsage => {
  const value = assertString(name, valueIn);
  try {
    return assertAttributeUsageJSON(value);
  } catch {
    throw new InvalidArgumentError('AttributeUsage', name, value);
  }
};

export const assertAttribute = (name: string, attribute?: unknown): Attribute => {
  if (!isObject(attribute)) {
    throw new InvalidArgumentError('Attribute', name, attribute);
  }

  const usage = assertProperty(attribute, 'Attribute', 'usage', assertAttributeUsage);
  switch (usage) {
    case 'ContractHash':
    case 'Vote':
    case 'Hash1':
    case 'Hash2':
    case 'Hash3':
    case 'Hash4':
    case 'Hash5':
    case 'Hash6':
    case 'Hash7':
    case 'Hash8':
    case 'Hash9':
    case 'Hash10':
    case 'Hash11':
    case 'Hash12':
    case 'Hash13':
    case 'Hash14':
    case 'Hash15':
      return {
        usage,
        data: assertProperty(attribute, 'Attribute', 'data', assertHash256),
      };
    case 'Script':
      return {
        usage,
        data: assertProperty(attribute, 'Attribute', 'data', assertAddress),
      };
    case 'ECDH02':
    case 'ECDH03':
      return {
        usage,
        data: assertProperty(attribute, 'Attribute', 'data', assertPublicKey),
      };
    case 'DescriptionUrl':
    case 'Description':
    case 'Remark':
    case 'Remark1':
    case 'Remark2':
    case 'Remark3':
    case 'Remark4':
    case 'Remark5':
    case 'Remark6':
    case 'Remark7':
    case 'Remark8':
    case 'Remark9':
    case 'Remark10':
    case 'Remark11':
    case 'Remark12':
    case 'Remark13':
    case 'Remark14':
    case 'Remark15':
      return {
        usage,
        data: assertProperty(attribute, 'Attribute', 'data', assertBuffer),
      };
    default:
      /* istanbul ignore next */
      utils.assertNever(usage);
      /* istanbul ignore next */
      throw new Error('For TS');
  }
};

export const assertTransactionOptions = (name: string, options?: unknown): TransactionOptions => {
  if (options == undefined) {
    return {};
  }

  if (!isObject(options)) {
    throw new InvalidArgumentError('TransactionOptions', name, options);
  }

  return {
    from: assertProperty(options, 'TransactionOptions', 'from', assertNullableUserAccountID),
    attributes: assertProperty(options, 'TransactionOptions', 'attributes', assertNullableArray).map((value) =>
      assertAttribute('TransactionOption.attributes', value),
    ),
    networkFee: assertProperty(options, 'TransactionOptions', 'networkFee', assertNullableBigNumber),
    systemFee: assertProperty(options, 'TransactionOptions', 'systemFee', assertNullableBigNumber),
    // tslint:disable-next-line no-any
    monitor: (options as any).monitor,
  };
};

const ASSET_TYPES = new Set(['Credit', 'Duty', 'Governing', 'Utility', 'Currency', 'Share', 'Invoice', 'Token']);

const assertAssetType = (name: string, assetTypeIn?: unknown): AssetType => {
  const assetType = assertString(name, assetTypeIn);

  if (!ASSET_TYPES.has(assetType)) {
    throw new InvalidArgumentError('AssetType', name, assetType);
  }

  return assetType as AssetType;
};

export const assertAssetRegister = (name: string, register?: unknown): AssetRegister => {
  if (!isObject(register)) {
    throw new InvalidArgumentError('AssetRegister', name, register);
  }

  return {
    type: assertProperty(register, 'AssetRegister', 'type', assertAssetType),
    name: assertProperty(register, 'AssetRegister', 'name', assertString),
    amount: assertProperty(register, 'AssetRegister', 'amount', assertBigNumber),
    precision: assertProperty(register, 'AssetRegister', 'precision', assertNumber),
    owner: assertProperty(register, 'AssetRegister', 'owner', assertPublicKey),
    admin: assertProperty(register, 'AssetRegister', 'admin', assertAddress),
    issuer: assertProperty(register, 'AssetRegister', 'issuer', assertAddress),
  };
};
const CONTRACT_PARAMETER_TYPES = new Set([
  'Signature',
  'Boolean',
  'Integer',
  'Address',
  'Hash256',
  'Buffer',
  'PublicKey',
  'String',
  'Array',
  'InteropInterface',
  'Void',
]);

const assertContractParameterType = (name: string, valueIn?: unknown): ContractParameterType => {
  const value = assertString(name, valueIn);
  if (!CONTRACT_PARAMETER_TYPES.has(value)) {
    throw new InvalidArgumentError('ContractParameterType', name, value);
  }

  return value as ContractParameterType;
};

export const assertContractRegister = (name: string, register?: unknown): ContractRegister => {
  if (!isObject(register)) {
    throw new InvalidArgumentError('ContractRegister', name, register);
  }

  return {
    script: assertProperty(register, 'ContractRegister', 'script', assertBuffer),
    parameters: assertProperty(register, 'ContractRegister', 'parameters', assertArray).map((value) =>
      assertContractParameterType('ContractRegister.parameters', value),
    ),
    returnType: assertProperty(register, 'ContractRegister', 'returnType', assertContractParameterType),
    name: assertProperty(register, 'ContractRegister', 'name', assertString),
    codeVersion: assertProperty(register, 'ContractRegister', 'codeVersion', assertString),
    author: assertProperty(register, 'ContractRegister', 'author', assertString),
    email: assertProperty(register, 'ContractRegister', 'email', assertString),
    description: assertProperty(register, 'ContractRegister', 'description', assertString),
    storage: assertProperty(register, 'ContractRegister', 'storage', assertBoolean),
    dynamicInvoke: assertProperty(register, 'ContractRegister', 'dynamicInvoke', assertBoolean),
    payable: assertProperty(register, 'ContractRegister', 'payable', assertBoolean),
  };
};

const ABI_TYPES = new Set([
  'Signature',
  'Boolean',
  'Address',
  'Hash256',
  'Buffer',
  'PublicKey',
  'String',
  'Array',
  'Void',
  'Integer',
  'ForwardValue',
]);

const assertABIType = (name: string, valueIn?: unknown): ABIReturn['type'] => {
  const value = assertString(name, valueIn);

  if (!ABI_TYPES.has(value)) {
    throw new InvalidArgumentError('ABIType', name, value);
  }

  return value as ABIReturn['type'];
};

const assertABIReturn = (name: string, value?: unknown): ABIReturn => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ABIReturn', name, value);
  }

  const type = assertProperty(value, 'ABIReturn', 'type', assertABIType);
  const optional = assertProperty(value, 'ABIReturn', 'optional', assertNullableBoolean);
  const forwardedValue = assertProperty(value, 'ABIReturn', 'forwardedValue', assertNullableBoolean);
  switch (type) {
    case 'Signature':
      return { type, optional, forwardedValue };
    case 'Boolean':
      return { type, optional, forwardedValue };
    case 'Address':
      return { type, optional, forwardedValue };
    case 'Hash256':
      return { type, optional, forwardedValue };
    case 'Buffer':
      return { type, optional, forwardedValue };
    case 'PublicKey':
      return { type, optional, forwardedValue };
    case 'String':
      return { type, optional, forwardedValue };
    case 'Array':
      return { type, value: assertProperty(value, 'ABIReturn', 'value', assertABIReturn), optional, forwardedValue };
    case 'Void':
      return { type, optional, forwardedValue };
    case 'Integer':
      return { type, decimals: assertProperty(value, 'ABIReturn', 'decimals', assertNumber), optional, forwardedValue };
    case 'ForwardValue':
      return { type, optional, forwardedValue };
    default:
      /* istanbul ignore next */
      utils.assertNever(type);
      /* istanbul ignore next */
      throw new Error('For TS');
  }
};

const assertABIDefaultType = (name: string, valueIn?: unknown): ABIDefaultType => {
  const value = assertString(name, valueIn);
  switch (value) {
    case 'sender':
      return 'sender';
    default:
      throw new InvalidArgumentError('ABIDefaultType', name, value);
  }
};

const assertNullableABIDefault = (name: string, value?: unknown): ABIDefault | undefined => {
  if (value == undefined) {
    return undefined;
  }

  if (!isObject(value)) {
    throw new InvalidArgumentError('ABIDefault', name, value);
  }

  const type = assertProperty(value, 'ABIDefault', 'type', assertABIDefaultType);
  switch (type) {
    case 'sender':
      return { type: 'sender' };
    default:
      throw new InvalidArgumentError('ABIDefaultType', name, value);
  }
};

const assertABIParameter = (propName: string, value?: unknown): ABIParameter => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ABIParameter', propName, value);
  }

  const type = assertProperty(value, 'ABIParameter', 'type', assertABIType);
  const name = assertProperty(value, 'ABIParameter', 'name', assertString);
  const optional = assertProperty(value, 'ABIParameter', 'optional', assertNullableBoolean);
  const rest = assertProperty(value, 'ABIParameter', 'rest', assertNullableBoolean);
  const defaultValue = assertProperty(value, 'ABIParameter', 'default', assertNullableABIDefault);
  const forwardedValue = assertProperty(value, 'ABIParameter', 'forwardedValue', assertNullableBoolean);

  switch (type) {
    case 'Signature':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'Boolean':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'Address':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'Hash256':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'Buffer':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'PublicKey':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'String':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'Array':
      return {
        type,
        name,
        optional,
        default: defaultValue,
        value: assertProperty(value, 'ABIParameter', 'value', assertABIReturn),
        forwardedValue,
        rest,
      };
    case 'Void':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'Integer':
      return {
        type,
        name,
        optional,
        default: defaultValue,
        decimals: assertProperty(value, 'ABIParameter', 'decimals', assertNumber),
        forwardedValue,
      };
    case 'ForwardValue':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    default:
      /* istanbul ignore next */
      utils.assertNever(type);
      /* istanbul ignore next */
      throw new Error('For TS');
  }
};

const assertABIFunction = (name: string, value?: unknown): ABIFunction => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ABIFunction', name, value);
  }

  return {
    name: assertProperty(value, 'ABIFunction', 'name', assertString),
    parameters: assertProperty(value, 'ABIFunction', 'parameters', assertNullableArray).map((parameter) =>
      assertABIParameter('ABIFunction.parameters', parameter),
    ),
    returnType: assertProperty(value, 'ABIFunction', 'returnType', assertABIReturn),
    constant: assertProperty(value, 'ABIFunction', 'constant', assertNullableBoolean),
    send: assertProperty(value, 'ABIFunction', 'send', assertNullableBoolean),
    receive: assertProperty(value, 'ABIFunction', 'receive', assertNullableBoolean),
    claim: assertProperty(value, 'ABIFunction', 'claim', assertNullableBoolean),
  };
};

const assertABIEvent = (name: string, value?: unknown): ABIEvent => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ABIEvent', name, value);
  }

  return {
    name: assertProperty(value, 'ABIEvent', 'name', assertString),
    parameters: assertProperty(value, 'ABIEvent', 'parameters', assertNullableArray).map((parameter) =>
      assertABIParameter('ABIEvent.parameters', parameter),
    ),
  };
};

export const assertABI = (name: string, value?: unknown): ABI => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ABI', name, value);
  }

  return {
    functions: assertProperty(value, 'ABI', 'functions', assertNullableArray).map((func) =>
      assertABIFunction('ABI.functions', func),
    ),
    events: assertProperty(value, 'ABI', 'events', assertNullableArray).map((func) =>
      assertABIEvent('ABI.events', func),
    ),
  };
};

const assertSmartContractNetworkDefinition = (name: string, value?: unknown): SmartContractNetworkDefinition => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('SmartContractNetworkDefinition', name, value);
  }

  return {
    address: assertProperty(value, 'SmartContractNetworkDefinition', 'address', assertAddress),
  };
};

const assertSmartContractNetworksDefinition = (name: string, value?: unknown): SmartContractNetworksDefinition => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('SmartContractNetworksDefinition', name, value);
  }

  return _.mapValues(value, (val) =>
    assertSmartContractNetworkDefinition('SmartContractNetworksDefinition', val),
  ) as SmartContractNetworksDefinition;
};

// tslint:disable-next-line no-any
const isPromise = (value: unknown): value is Promise<any> =>
  // tslint:disable-next-line no-any
  typeof value === 'object' && (value as any).then !== undefined;

const assertSourceMaps = (name: string, value?: unknown): Promise<SourceMaps> | undefined => {
  if (value == undefined) {
    return undefined;
  }

  if (!isPromise(value)) {
    throw new InvalidArgumentError('SourceMaps', name, value);
  }

  return value;
};

export const assertSmartContractDefinition = (name: string, value?: unknown): SmartContractDefinition => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('SmartContractDefinition', name, value);
  }

  return {
    networks: assertProperty(value, 'SmartContractDefinition', 'networks', assertSmartContractNetworksDefinition),
    abi: assertProperty(value, 'SmartContractDefinition', 'abi', assertABI),
    sourceMaps: assertProperty(value, 'SmartContractDefinition', 'sourceMaps', assertSourceMaps),
  };
};

export const assertReadSmartContractDefinition = (name: string, value?: unknown): ReadSmartContractDefinition => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ReadSmartContractDefinition', name, value);
  }

  return {
    address: assertProperty(value, 'ReadSmartContractDefinition', 'address', assertAddress),
    abi: assertProperty(value, 'ReadSmartContractDefinition', 'abi', assertABI),
    sourceMaps: assertProperty(value, 'ReadSmartContractDefinition', 'sourceMaps', assertSourceMaps),
  };
};

export const assertTransfer = (name: string, value?: unknown): Transfer => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('Transfer', name, value);
  }

  return {
    amount: assertProperty(value, 'Transfer', 'amount', assertBigNumber),
    asset: assertProperty(value, 'Transfer', 'asset', assertHash256),
    to: assertProperty(value, 'Transfer', 'to', assertAddress),
  };
};

export const assertTransfers = (name: string, valueIn?: unknown): ReadonlyArray<Transfer> => {
  const value = assertArray(name, valueIn);

  return value.map((val) => assertTransfer(name, val));
};

export const assertUserAccountID = (name: string, value?: unknown): UserAccountID => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('UserAccountID', name, value);
  }

  return {
    network: assertProperty(value, 'UserAccountID', 'network', assertString),
    address: assertProperty(value, 'UserAccountID', 'address', assertAddress),
  };
};

export const assertNullableUserAccountID = (name: string, value?: unknown): UserAccountID | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertUserAccountID(name, value);
};

export const assertUpdateAccountNameOptions = (name: string, value?: unknown): UpdateAccountNameOptions => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('UpdateAccountNameOptions', name, value);
  }

  return {
    id: assertProperty(value, 'UpdateAccountNameOptions', 'id', assertUserAccountID),
    name: assertProperty(value, 'UpdateAccountNameOptions', 'name', assertString),
  };
};

export const assertPrivateKey = (name: string, valueIn?: unknown): PrivateKeyString => {
  const value = assertString(name, valueIn);
  try {
    privateKeyToPublicKey(value);

    return value;
  } catch {
    try {
      return wifToPrivateKey(value);
    } catch {
      throw new InvalidArgumentError('PrivateKey', name, value);
    }
  }
};

const assertScriptBuilderParam = (name: string, value?: unknown): ScriptBuilderParam => {
  if (value == undefined) {
    throw new InvalidArgumentError('ScriptBuilderParam', name, value);
  }

  // tslint:disable-next-line no-any
  return value as any;
};

const assertNullableScriptBuilderParam = (name: string, value?: unknown): ScriptBuilderParam | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertScriptBuilderParam(name, value);
};

const assertParam = (name: string, value?: unknown): Param => {
  if (value == undefined) {
    throw new InvalidArgumentError('Param', name, value);
  }

  // tslint:disable-next-line no-any
  return value as any;
};

const assertNullableParam = (name: string, value?: unknown): Param | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertParam(name, value);
};

export const assertForwardValue = (name: string, value?: unknown): ForwardValue => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('UserAccountID', name, value);
  }

  return {
    name: assertProperty(value, 'ForwardValue', 'name', assertString),
    converted: assertProperty(value, 'ForwardValue', 'converted', assertNullableScriptBuilderParam),
    param: assertProperty(value, 'ForwardValue', 'param', assertNullableParam),
    // tslint:disable-next-line no-any
  } as any;
};
