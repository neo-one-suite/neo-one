// tslint:disable strict-type-predicates
import {
  ABIDefault,
  ABIDefaultType,
  ABIParameter,
  ABIReturn,
  AddressString,
  addressToScriptHash,
  assertAttributeTypeJSON,
  assertCallFlags as clientAssertCallFlags,
  Attribute,
  AttributeTypeModel,
  BufferString,
  CallFlags,
  common,
  ContractABI,
  ContractABIClient,
  ContractEventDescriptor,
  ContractEventDescriptorClient,
  ContractGroup,
  ContractManifest,
  ContractManifestClient,
  ContractMethodDescriptor,
  ContractMethodDescriptorClient,
  ContractParameter,
  ContractParameterDefinition,
  ContractPermission,
  ContractPermissionDescriptor,
  ForwardValue,
  Hash256String,
  InvokeSendUnsafeReceiveTransactionOptions,
  IterOptions,
  MethodToken,
  NefFile,
  Param,
  PrivateKeyString,
  privateKeyToPublicKey,
  PublicKeyString,
  ScriptBuilderParam,
  scriptHashToAddress,
  SmartContractDefinition,
  SmartContractNetworkDefinition,
  SmartContractNetworksDefinition,
  SourceMaps,
  toAttributeType,
  TransactionOptions,
  Transfer,
  UInt160Hex,
  UpdateAccountNameOptions,
  UserAccountID,
  wifToPrivateKey,
  Wildcard,
  WildcardContainer,
} from '@neo-one/client-common';
import { JSONObject, JSONValue, OmitStrict, utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import _ from 'lodash';
import { InvalidArgumentError } from './errors';

export const assertString = (name: string, param?: unknown): string => {
  if (param == undefined || typeof param !== 'string') {
    throw new InvalidArgumentError('string', name, param);
  }

  return param;
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

export const assertNonNegativeNumber = (name: string, value?: unknown): number => {
  if (value == undefined || typeof value !== 'number' || value < 0) {
    throw new InvalidArgumentError('number', name, value);
  }

  return value;
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
  if (typeof value !== 'number') {
    throw new InvalidArgumentError('number', name, value);
  }

  return value;
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

export const tryGetUInt160Hex = (name: string, addressOrUInt160In: unknown): UInt160Hex => {
  const addressOrUInt160 = assertString(name, addressOrUInt160In);

  try {
    scriptHashToAddress(addressOrUInt160);

    return addressOrUInt160;
  } catch {
    try {
      return addressToScriptHash(addressOrUInt160);
    } catch {
      throw new InvalidArgumentError('AddressOrUInt160', name, addressOrUInt160);
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

const assertNullablePublicKey = (name: string, publicKey?: unknown): PublicKeyString | undefined => {
  if (publicKey == undefined) {
    return undefined;
  }

  return assertPublicKey(name, publicKey);
};

export const assertPublicKey = (name: string, publicKey?: unknown): PublicKeyString => {
  const value = assertBuffer(name, publicKey);
  try {
    return common.ecPointToString(common.stringToECPoint(value));
  } catch {
    throw new InvalidArgumentError('PublicKey', name, value);
  }
};

const assertNullableUInt160Hex = (name: string, value?: unknown): UInt160Hex | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertUInt160Hex(name, value);
};

const assertUInt160Hex = (name: string, value?: unknown): UInt160Hex => {
  const valueIn = assertString(name, value);

  try {
    return common.uInt160ToString(common.stringToUInt160(valueIn));
  } catch {
    throw new InvalidArgumentError('UInt160Hex', name, value);
  }
};

export const assertBigNumber = (name: string, value?: unknown): BigNumber => {
  if (value == undefined || !BigNumber.isBigNumber(value)) {
    throw new InvalidArgumentError('BigNumber', name, value);
  }

  return value;
};

export const assertNullableBigNumber = (name: string, value?: unknown): BigNumber | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertBigNumber(name, value);
};

export const assertBN = (name: string, value?: unknown): BN => {
  if (value == undefined || !BN.isBN(value)) {
    throw new InvalidArgumentError('BN', name, value);
  }

  return value;
};

export const assertArray = (name: string, value?: unknown): readonly unknown[] => {
  if (!Array.isArray(value)) {
    throw new InvalidArgumentError('Array', name, value);
  }

  return value;
};

export const assertNullableArray = (name: string, value?: unknown): readonly unknown[] => {
  if (value == undefined) {
    return [];
  }

  return assertArray(name, value);
};

export const assertMap = (name: string, value?: unknown): ReadonlyMap<unknown, unknown> => {
  if (!(value instanceof Map)) {
    throw new InvalidArgumentError('Map', name, value);
  }

  return value;
};

export const assertObject = (name: string, value?: unknown): { readonly [key: string]: unknown } => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('Object', name, value);
  }

  return value as { readonly [key: string]: unknown };
};

export const assertNullableMap = (name: string, value?: unknown): ReadonlyMap<unknown, unknown> => {
  if (value == undefined) {
    return new Map();
  }

  return assertMap(name, value);
};

export const isObject = (value?: unknown): value is object => value != undefined && typeof value === 'object';
export const assertProperty = <T, Name extends string, P>(
  value: T,
  objectName: string,
  name: Name,
  assertType: (name: string, v?: unknown) => P,
): P => {
  // tslint:disable-next-line no-any
  const valueAny: any = value;

  return assertType(`${objectName}.${name}`, valueAny[name]);
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

const CONTRACT_PARAMETER_TYPES = new Set([
  'Any',
  'Signature',
  'Boolean',
  'Address',
  'Hash160',
  'Hash256',
  'Buffer',
  'PublicKey',
  'String',
  'Array',
  'Map',
  'Object',
  'Void',
  'Integer',
  'ForwardValue',
]);

const assertContractParameterType = (name: string, valueIn?: unknown): ContractParameterDefinition['type'] => {
  const value = assertString(name, valueIn);

  if (!CONTRACT_PARAMETER_TYPES.has(value)) {
    throw new InvalidArgumentError('ContractParameterType', name, value);
  }

  return value as ContractParameterDefinition['type'];
};

const assertMapProperty = <T, Name extends string, P>(
  value: T,
  objectName: string,
  name: Name,
  assertType: (name: string, v?: unknown) => P,
): ReadonlyArray<readonly [P, P]> => {
  const map = assertProperty(value, objectName, name, assertMap);
  const result: Array<[P, P]> = [];
  map.forEach((val, key) => {
    const keyOut = assertType(`${objectName}.${name}`, key);
    const valOut = assertType(`${objectName}.${name}`, val);

    // tslint:disable-next-line: no-array-mutation
    result.push([keyOut, valOut]);
  });

  return result;
};

const ABI_TYPES = new Set([
  'Any',
  'Signature',
  'Boolean',
  'Hash160',
  'Address',
  'Hash256',
  'Buffer',
  'PublicKey',
  'String',
  'Array',
  'Map',
  'Object',
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

const assertContractParameter = (paramName: string, value?: unknown): ContractParameter => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractParameter', paramName, value);
  }

  const type = assertProperty(value, 'ContractParameter', 'type', assertContractParameterType);

  switch (type) {
    case 'Any':
      return { type, value: undefined };
    case 'Signature':
      return { type, value: assertProperty(value, 'ContractParameter', 'value', assertString) };
    case 'Boolean':
      return { type, value: assertProperty(value, 'ContractParameter', 'value', assertBoolean) };
    case 'Address':
      return { type, value: assertProperty(value, 'ContractParameter', 'value', assertAddress) };
    case 'Hash160':
      return { type, value: assertProperty(value, 'ContractParameter', 'value', assertAddress) };
    case 'Hash256':
      return { type, value: assertProperty(value, 'ContractParameter', 'value', assertHash256) };
    case 'Buffer':
      return { type, value: assertProperty(value, 'ContractParameter', 'value', assertBuffer) };
    case 'PublicKey':
      return { type, value: assertProperty(value, 'ContractParameter', 'value', assertPublicKey) };
    case 'String':
      return { type, value: assertProperty(value, 'ContractParameter', 'value', assertString) };
    case 'Array':
      return {
        type,
        value: assertProperty(value, 'ContractParameter', 'value', assertArray).map((param) =>
          assertContractParameter('Array', param),
        ),
      };
    case 'Map':
      return {
        type,
        value: assertMapProperty(value, 'ContractParameter', 'value', assertContractParameter),
      };
    case 'Void':
      return { type };
    case 'Integer':
      return {
        type,
        value: assertProperty(value, 'ContractParameter', 'value', assertBN),
      };
    case 'InteropInterface':
      return { type };
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
    case 'Any':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'Signature':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'Boolean':
      return { type, name, optional, default: defaultValue, forwardedValue, rest };
    case 'Hash160':
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
    case 'Map':
      return {
        type,
        name,
        optional,
        default: defaultValue,
        key: assertProperty(value, 'ABIParameter', 'key', assertABIReturn),
        value: assertProperty(value, 'ABIParameter', 'value', assertABIReturn),
        forwardedValue,
        rest,
      };
    case 'Object':
      return {
        type,
        name,
        optional,
        default: defaultValue,
        properties: assertProperty(value, 'ABIParameter', 'properties', assertABIProperties),
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

const assertABIProperties = (name: string, value?: unknown): { readonly [key: string]: ABIReturn } => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ABIReturn', name, value);
  }

  return _.fromPairs(Object.entries(value).map(([k, v]) => [assertString(name, k), assertABIReturn(name, v)]));
};

const assertABIReturn = (name: string, value?: unknown): ABIReturn => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ABIReturn', name, value);
  }

  const type = assertProperty(value, 'ABIReturn', 'type', assertABIType);
  const optional = assertProperty(value, 'ABIReturn', 'optional', assertNullableBoolean);
  const forwardedValue = assertProperty(value, 'ABIReturn', 'forwardedValue', assertNullableBoolean);
  switch (type) {
    case 'Any':
      return { type, optional, forwardedValue };
    case 'Signature':
      return { type, optional, forwardedValue };
    case 'Boolean':
      return { type, optional, forwardedValue };
    case 'Hash160':
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
    case 'Map':
      return {
        type,
        key: assertProperty(value, 'ABIReturn', 'key', assertABIReturn),
        value: assertProperty(value, 'ABIReturn', 'value', assertABIReturn),
        optional,
        forwardedValue,
      };
    case 'Object':
      return {
        type,
        properties: assertProperty(value, 'ABIReturn', 'properties', assertABIProperties),
        optional,
        forwardedValue,
      };
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

const assertContractMethodDescriptorClient = (name: string, value?: unknown): ContractMethodDescriptorClient => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractMethodDescriptorClient', name, value);
  }

  return {
    name: assertProperty(value, 'ContractMethodDescriptorClient', 'name', assertString),
    parameters: assertProperty(
      value,
      'ContractMethodDescriptorClient',
      'parameters',
      assertNullableArray,
    ).map((parameter) => assertABIParameter('ContractMethodDescriptorClient.parameters', parameter)),
    returnType: assertProperty(value, 'ContractMethodDescriptorClient', 'returnType', assertABIReturn),
    constant: assertProperty(value, 'ContractMethodDescriptorClient', 'constant', assertNullableBoolean),
    safe: assertProperty(value, 'ContractMethodDescriptorClient', 'safe', assertBoolean),
    offset: assertProperty(value, 'ContractMethodDescriptorClient', 'offset', assertNumber),
  };
};

const assertContractMethodDescriptor = (name: string, value?: unknown): ContractMethodDescriptor => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractMethodDescriptor', name, value);
  }

  return {
    name: assertProperty(value, 'ContractMethodDescriptor', 'name', assertString),
    parameters: assertProperty(value, 'ContractMethodDescriptor', 'parameters', assertNullableArray).map((parameter) =>
      assertContractParameter('ContractMethodDescriptor.parameters', parameter),
    ),
    returnType: assertProperty(value, 'ContractMethodDescriptor', 'returnType', assertContractParameterType),
    offset: assertProperty(value, 'ContractMethodDescriptor', 'offset', assertNumber),
  };
};

const assertContractEventDescriptorClient = (name: string, value?: unknown): ContractEventDescriptorClient => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractEventDescriptorClient', name, value);
  }

  return {
    name: assertProperty(value, 'ContractEventDescriptorClient', 'name', assertString),
    parameters: assertProperty(
      value,
      'ContractEventDescriptorClient',
      'parameters',
      assertNullableArray,
    ).map((parameter) => assertABIParameter('ContractEventDescriptorClient.parameters', parameter)),
  };
};

const assertContractEventDescriptor = (name: string, value?: unknown): ContractEventDescriptor => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractEventDescriptor', name, value);
  }

  return {
    name: assertProperty(value, 'ContractEventDescriptor', 'name', assertString),
    parameters: assertProperty(value, 'ContractEventDescriptor', 'parameters', assertNullableArray).map((parameter) =>
      assertContractParameter('ContractEventDescriptor.parameters', parameter),
    ),
  };
};

export const assertContractABIClient = (name: string, value?: unknown): ContractABIClient => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractABI', name, value);
  }

  return {
    methods: assertProperty(value, 'ContractABI', 'methods', assertArray).map((method) =>
      assertContractMethodDescriptorClient('ContractABI.methods', method),
    ),
    events: assertProperty(value, 'ABI', 'events', assertArray).map((func) =>
      assertContractEventDescriptorClient('ABI.events', func),
    ),
  };
};

export const assertContractABI = (name: string, value?: unknown): ContractABI => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractABI', name, value);
  }

  return {
    methods: assertProperty(value, 'ContractABI', 'methods', assertArray).map((method) =>
      assertContractMethodDescriptor('ContractABI.methods', method),
    ),
    events: assertProperty(value, 'ABI', 'events', assertArray).map((func) =>
      assertContractEventDescriptor('ABI.events', func),
    ),
  };
};

export const assertWildcardContainer = (name: string, value: unknown): WildcardContainer<unknown> => {
  if (value === undefined || value === '*') {
    return '*';
  }
  if (!Array.isArray(value) && value !== '*') {
    throw new InvalidArgumentError('WildcardContainer', name, value);
  }

  return value;
};

export const assertWildcardContainerProperty = <T, Name extends string, P>(
  value: T,
  objectName: string,
  name: Name,
  assertType: (name: string, v?: unknown) => P,
): readonly P[] | Wildcard => {
  const wildcardOrArray = assertProperty(value, objectName, name, assertWildcardContainer);
  if (wildcardOrArray === '*') {
    return '*';
  }

  return assertProperty(value, objectName, name, assertArray).map((val) => assertType(`${objectName}.${name}`, val));
};

export const isJSON = (value?: unknown): value is JSONObject => {
  if (value === undefined) {
    return false;
  }

  if (!isObject(value)) {
    return false;
  }

  try {
    Object.keys(value).forEach((key) => assertString('JSONObject', key));
    Object.values(value).forEach((val) => assertJSONValue('JSONObject', val));
  } catch {
    return false;
  }

  return true;
};

export const isJSONValue = (value?: unknown): value is JSONValue => {
  if (value === undefined) {
    return false;
  }
  if (typeof value === 'object') {
    return isJSON(value);
  }
  if (Array.isArray(value)) {
    return value.every(isJSONValue);
  }

  return true;
};

export const assertJSONValue = (name: string, value?: unknown): JSONValue => {
  if (!isJSONValue(value)) {
    throw new InvalidArgumentError('JSONObject', name, value);
  }

  return value;
};

export const assertNullableJSON = (name: string, value?: unknown): JSONObject => {
  if (value === undefined) {
    return {};
  }

  if (!isJSON(value)) {
    throw new InvalidArgumentError('JSONObject', name, value);
  }

  return value;
};

export const assertCallFlags = (name: string, value?: unknown): CallFlags => {
  const numberIn = assertNumber(name, value);
  let result;
  try {
    result = clientAssertCallFlags(numberIn);
  } catch {
    throw new InvalidArgumentError('CallFlags', name, value);
  }

  return result;
};

export const assertMethodToken = (name: string, value?: unknown): MethodToken => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('MethodToken', name, value);
  }

  return {
    hash: assertProperty(value, 'MethodToken', 'hash', assertUInt160Hex),
    method: assertProperty(value, 'MethodToken', 'method', assertString),
    paramCount: assertProperty(value, 'MethodToken', 'paramCount', assertNonNegativeNumber),
    hasReturnValue: assertProperty(value, 'MethodToken', 'hasReturnValue', assertBoolean),
    callFlags: assertProperty(value, 'MethodToken', 'callFlags', assertCallFlags),
  };
};

export const assertNefFile = (name: string, value?: unknown): Omit<NefFile, 'checksum' | 'magic'> => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('NefFile', name, value);
  }

  return {
    compiler: assertProperty(value, 'NefFile', 'compiler', assertString),
    script: assertProperty(value, 'NefFile', 'script', assertString),
    tokens: assertProperty(value, 'NefFile', 'tokens', assertArray).map((token) =>
      assertMethodToken('NefFile.tokens', token),
    ),
  };
};

export const assertContractManifestClient = (name: string, value?: unknown): ContractManifestClient => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractManifest', name, value);
  }

  return {
    name: assertProperty(value, 'ContractManifest', 'name', assertString),
    groups: assertProperty(value, 'ContractManifest', 'groups', assertArray).map((group) =>
      assertContractGroup('ContractManifest.groups', group),
    ),
    supportedStandards: assertProperty(value, 'ContractManifest', 'supportedStandards', assertArray).map((std) =>
      assertString('ContractManifest.supportedStandards', std),
    ),
    abi: assertProperty(value, 'ContractManifest', 'abi', assertContractABIClient),
    permissions: assertProperty(value, 'ContractManifest', 'permissions', assertArray).map((permission) =>
      assertContractPermission('ContractManifest.permissions', permission),
    ),
    trusts: assertWildcardContainerProperty(value, 'ContractManifest', 'trusts', assertUInt160Hex),
    extra: assertProperty(value, 'ContractManifest', 'extra', assertNullableJSON),
  };
};

export const assertContractManifest = (name: string, value?: unknown): ContractManifest => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractManifest', name, value);
  }

  return {
    name: assertProperty(value, 'ContractManifest', 'name', assertString),
    groups: assertProperty(value, 'ContractManifest', 'groups', assertArray).map((group) =>
      assertContractGroup('ContractManifest.groups', group),
    ),
    supportedStandards: assertProperty(value, 'ContractManifest', 'supportedStandards', assertArray).map((std) =>
      assertString('ContractManifest.supportedStandards', std),
    ),
    abi: assertProperty(value, 'ContractManifest', 'abi', assertContractABI),
    permissions: assertProperty(value, 'ContractManifest', 'permissions', assertArray).map((permission) =>
      assertContractPermission('ContractManifest.permissions', permission),
    ),
    trusts: assertWildcardContainerProperty(value, 'ContractManifest', 'trusts', assertUInt160Hex),
    extra: assertProperty(value, 'ContractManifest', 'extra', assertNullableJSON),
  };
};

const assertContractPermission = (name: string, value?: unknown): ContractPermission => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractPermission', name, value);
  }

  return {
    contract: assertProperty(value, 'ContractPermission', 'contract', assertContractPermissionDescriptor),
    methods: assertWildcardContainerProperty(value, 'ContractPermission', 'methods', assertString),
  };
};

const assertContractPermissionDescriptor = (name: string, value?: unknown): ContractPermissionDescriptor => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractPermissionDescriptor', name, value);
  }
  const hash = assertProperty(value, 'ContractPermissionDescriptor', 'hash', assertNullableUInt160Hex);
  const group = assertProperty(value, 'ContractPermissionDescriptor', 'group', assertNullablePublicKey);

  if (hash === undefined && group === undefined) {
    throw new InvalidArgumentError('ContractPermissionDescriptor', name, value);
  }

  return {
    hash,
    group,
  };
};

const assertContractGroup = (name: string, value?: unknown): ContractGroup => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ContractGroup', name, value);
  }

  return {
    publicKey: assertProperty(value, 'ContractGroup', 'publicKey', assertPublicKey),
    signature: assertProperty(value, 'ContractGroup', 'signature', assertBuffer),
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

export const assertSourceMaps = (_name: string, value?: unknown): SourceMaps | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return value as SourceMaps;
};

export const assertSmartContractDefinition = (name: string, value?: unknown): SmartContractDefinition => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('SmartContractDefinition', name, value);
  }

  return {
    networks: assertProperty(value, 'SmartContractDefinition', 'networks', assertSmartContractNetworksDefinition),
    manifest: assertProperty(value, 'SmartContractDefinition', 'manifest', assertContractManifestClient),
    sourceMaps: assertProperty(value, 'SmartContractDefinition', 'sourceMaps', assertSourceMaps),
  };
};

export const assertScriptBuilderParam = (name: string, value?: unknown): ScriptBuilderParam => {
  if (value == undefined) {
    throw new InvalidArgumentError('ScriptBuilderParam', name, value);
  }

  // tslint:disable-next-line no-any
  return value as any;
};

export const assertNullableScriptBuilderParam = (name: string, value?: unknown): ScriptBuilderParam | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertScriptBuilderParam(name, value);
};

export const assertParam = (name: string, value?: unknown): Param => {
  if (value == undefined) {
    throw new InvalidArgumentError('Param', name, value);
  }

  // tslint:disable-next-line no-any
  return value as any;
};

export const assertNullableParam = (name: string, value?: unknown): Param | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertParam(name, value);
};

export const assertForwardValue = (name: string, value?: unknown): ForwardValue => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('ForwardValue', name, value);
  }

  return {
    name: assertProperty(value, 'ForwardValue', 'name', assertString),
    converted: assertProperty(value, 'ForwardValue', 'converted', assertNullableScriptBuilderParam),
    param: assertProperty(value, 'ForwardValue', 'param', assertNullableParam),
    // tslint:disable-next-line no-any
  } as any;
};

export const assertTransfer = (name: string, value?: unknown): Transfer => {
  if (!isObject(value)) {
    throw new InvalidArgumentError('Transfer', name, value);
  }

  return {
    amount: assertProperty(value, 'Transfer', 'amount', assertBigNumber),
    asset: assertProperty(value, 'Transfer', 'asset', tryGetUInt160Hex),
    to: assertProperty(value, 'Transfer', 'to', assertAddress),
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

export const assertTransfers = (name: string, valueIn?: unknown): readonly Transfer[] => {
  const value = assertArray(name, valueIn);

  return value.map((val) => assertTransfer(name, val));
};

const assertAttributeTypeArg = (name: string, valueIn?: unknown): AttributeTypeModel => {
  const value = assertString(name, valueIn);
  try {
    return toAttributeType(assertAttributeTypeJSON(value));
  } catch {
    throw new InvalidArgumentError('AttributeType', name, value);
  }
};

export const assertAttribute = (name: string, attribute?: unknown): Attribute => {
  if (!isObject(attribute)) {
    throw new InvalidArgumentError('Attribute', name, attribute);
  }

  // TODO: check this works for both attributes
  return {
    type: assertProperty(attribute, 'Attribute', 'type', assertAttributeTypeArg),
    id: assertProperty(attribute, 'Attribute', 'id', assertBigNumber),
    code: assertProperty(attribute, 'Attribute', 'code', assertNumber),
    result: assertProperty(attribute, 'Attribute', 'result', assertBuffer),
  };
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
    maxNetworkFee: assertProperty(options, 'TransactionOptions', 'maxNetworkFee', assertBigNumber),
    maxSystemFee: assertProperty(options, 'TransactionOptions', 'maxSystemFee', assertBigNumber),
  };
};

export const assertInvokeSendUnsafeReceiveTransactionOptions = (
  name: string,
  options?: unknown,
): InvokeSendUnsafeReceiveTransactionOptions => {
  if (options == undefined) {
    return {};
  }

  if (!isObject(options)) {
    throw new InvalidArgumentError('InvokeSendUnsafeReceiveTransactionOptions', name, options);
  }

  return {
    from: assertProperty(options, 'InvokeSendUnsafeReceiveTransactionOptions', 'from', assertNullableUserAccountID),
    attributes: assertProperty(
      options,
      'InvokeSendUnsafeReceiveTransactionOptions',
      'attributes',
      assertNullableArray,
    ).map((value) => assertAttribute('TransactionOption.attributes', value)),
    maxNetworkFee: assertProperty(
      options,
      'InvokeSendUnsafeReceiveTransactionOptions',
      'maxNetworKFee',
      assertNullableBigNumber,
    ),
    maxSystemFee: assertProperty(
      options,
      'InvokeSendUnsafeReceiveTransactionOptions',
      'maxSystemFee',
      assertNullableBigNumber,
    ),
    sendTo: assertProperty(options, 'InvokeSendUnsafeReceiveTransactionOptions', 'sendTo', assertNullableSendTo),
    sendFrom: assertProperty(options, 'InvokeSendUnsafeReceiveTransactionOptions', 'sendFrom', assertNullableSendFrom),
  };
};

const assertNullableSendTo = (name: string, value?: unknown): ReadonlyArray<OmitStrict<Transfer, 'to'>> | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertNullableArray(name, value).map((transfer) => ({
    amount: assertProperty(transfer, 'transfer', 'amount', assertBigNumber),
    asset: assertProperty(transfer, 'transfer', 'asset', assertHash256),
  }));
};

const assertNullableSendFrom = (name: string, value?: unknown): readonly Transfer[] | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return assertTransfers(name, value);
};

export const assertNullableIterOptions = (name: string, options?: unknown): IterOptions | undefined => {
  if (options == undefined) {
    return undefined;
  }
  if (!isObject(options)) {
    throw new InvalidArgumentError('IterOptions', name, options);
  }
  const indexStart = assertProperty(options, 'IterOptions', 'indexStart', assertNullableNumber);
  const indexStop = assertProperty(options, 'IterOptions', 'indexStop', assertNullableNumber);
  if (indexStart != undefined && indexStop != undefined && indexStart >= indexStop) {
    throw new InvalidArgumentError('IterOptions', name, options);
  }

  return {
    indexStart,
    indexStop,
  };
};
