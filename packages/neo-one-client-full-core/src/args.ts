// tslint:disable strict-type-predicates
import { AssetType, ContractParameterType, GetOptions, IterOptions } from '@neo-one/client-common';
import { args, InvalidArgumentError } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { AssetRegister, ContractRegister } from './types';

export const assertNullableNumber = (name: string, value?: unknown): number | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return args.assertNumber(name, value);
};

export const assertNullableBigNumber = (name: string, value?: unknown): BigNumber | undefined => {
  if (value == undefined) {
    return undefined;
  }

  return args.assertBigNumber(name, value);
};

export const assertIterOptions = (name: string, options?: unknown): IterOptions | undefined => {
  if (options == undefined) {
    return undefined;
  }

  if (!args.isObject(options)) {
    throw new InvalidArgumentError('IterOptions', name, options);
  }

  if (_.isEmpty(options)) {
    return {};
  }

  const output = {
    indexStart: args.assertProperty(options, 'IterOptions', 'indexStart', assertNullableNumber),
    indexStop: args.assertProperty(options, 'IterOptions', 'indexStop', assertNullableNumber),
  };

  if (output.indexStart !== undefined && output.indexStop !== undefined && output.indexStart > output.indexStop) {
    throw new InvalidArgumentError(
      'IterOptions',
      name,
      JSON.stringify(options),
      'Index start was greater than index stop.',
    );
  }

  return output;
};

export const assertGetOptions = (name: string, options?: unknown): GetOptions | undefined => {
  if (options == undefined) {
    return undefined;
  }

  if (!args.isObject(options)) {
    throw new InvalidArgumentError('GetOptions', name, options);
  }

  if (_.isEmpty(options)) {
    return {};
  }

  return {
    timeoutMS: args.assertProperty(options, 'GetOptions', 'timeoutMS', assertNullableNumber),
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
  'Map',
  'InteropInterface',
  'Void',
]);

const assertContractParameterType = (name: string, valueIn?: unknown): ContractParameterType => {
  const value = args.assertString(name, valueIn);
  if (!CONTRACT_PARAMETER_TYPES.has(value)) {
    throw new InvalidArgumentError('ContractParameterType', name, value);
  }

  return value as ContractParameterType;
};

export const assertContractRegister = (name: string, register?: unknown): ContractRegister => {
  if (!args.isObject(register)) {
    throw new InvalidArgumentError('ContractRegister', name, register);
  }

  return {
    script: args.assertProperty(register, 'ContractRegister', 'script', args.assertBuffer),
    parameters: args
      .assertProperty(register, 'ContractRegister', 'parameters', args.assertArray)
      .map((value) => assertContractParameterType('ContractRegister.parameters', value)),
    returnType: args.assertProperty(register, 'ContractRegister', 'returnType', assertContractParameterType),
    name: args.assertProperty(register, 'ContractRegister', 'name', args.assertString),
    codeVersion: args.assertProperty(register, 'ContractRegister', 'codeVersion', args.assertString),
    author: args.assertProperty(register, 'ContractRegister', 'author', args.assertString),
    email: args.assertProperty(register, 'ContractRegister', 'email', args.assertString),
    description: args.assertProperty(register, 'ContractRegister', 'description', args.assertString),
    storage: args.assertProperty(register, 'ContractRegister', 'storage', args.assertBoolean),
    dynamicInvoke: args.assertProperty(register, 'ContractRegister', 'dynamicInvoke', args.assertBoolean),
    payable: args.assertProperty(register, 'ContractRegister', 'payable', args.assertBoolean),
  };
};

const ASSET_TYPES = new Set(['Credit', 'Duty', 'Governing', 'Utility', 'Currency', 'Share', 'Invoice', 'Token']);

const assertAssetType = (name: string, assetTypeIn?: unknown): AssetType => {
  const assetType = args.assertString(name, assetTypeIn);

  if (!ASSET_TYPES.has(assetType)) {
    throw new InvalidArgumentError('AssetType', name, assetType);
  }

  return assetType as AssetType;
};

export const assertAssetRegister = (name: string, register?: unknown): AssetRegister => {
  if (!args.isObject(register)) {
    throw new InvalidArgumentError('AssetRegister', name, register);
  }

  return {
    type: args.assertProperty(register, 'AssetRegister', 'type', assertAssetType),
    name: args.assertProperty(register, 'AssetRegister', 'name', args.assertString),
    amount: args.assertProperty(register, 'AssetRegister', 'amount', args.assertBigNumber),
    precision: args.assertProperty(register, 'AssetRegister', 'precision', args.assertNumber),
    owner: args.assertProperty(register, 'AssetRegister', 'owner', args.assertPublicKey),
    admin: args.assertProperty(register, 'AssetRegister', 'admin', args.assertAddress),
    issuer: args.assertProperty(register, 'AssetRegister', 'issuer', args.assertAddress),
  };
};
