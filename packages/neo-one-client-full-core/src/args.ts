// tslint:disable strict-type-predicates
import { GetOptions, IterOptions } from '@neo-one/client-common';
import { args, InvalidArgumentError } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { ContractRegister } from './types';

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

export const assertContractRegister = (name: string, register?: unknown): ContractRegister => {
  if (!args.isObject(register)) {
    throw new InvalidArgumentError('ContractRegister', name, register);
  }

  return {
    script: args.assertProperty(register, 'ContractRegister', 'script', args.assertBuffer),
    manifest: args.assertProperty(register, 'ContractRegister', 'manifest', args.assertContractManifestClient),
    name: args.assertProperty(register, 'ContractRegister', 'name', args.assertString),
  };
};
