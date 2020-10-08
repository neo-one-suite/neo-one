import { common, ECPoint } from '@neo-one/client-common';
import { func, Params, Source, TSQL } from '@neo-one/edge';
import { Settings } from '@neo-one/node-core';
import path from 'path';
import { InvalidByteError, InvalidIntError, InvalidUIntError } from './errors';
import { ProtocolSettings } from './Methods';
import { DefaultMethods, DispatcherFunc } from './types';

const APP_ROOT = path.resolve(__dirname, '..');
const CSHARP_APP_ROOT = process.env.EDGE_APP_ROOT ?? path.resolve(APP_ROOT, 'lib', 'bin', 'Debug', 'netcoreapp3.0');

export const constants = {
  APP_ROOT,
  CSHARP_APP_ROOT,
};

type EdgeOptions = (() => void) | string | Params | Source | TSQL;

export const createCSharpDispatchInvoke = <Methods extends DefaultMethods>(
  options: EdgeOptions,
): DispatcherFunc<Methods> => {
  const invokeFunction = func(options);

  return (input) => invokeFunction(input, true);
};

export const blockchainSettingsToProtocolSettings = (settingsIn: Settings) => ({
  magic: settingsIn.messageMagic,
  addressVersion: settingsIn.addressVersion,
  standbyCommittee: settingsIn.standbyCommittee.map((ecpoint: ECPoint) => common.ecPointToString(ecpoint)),
  committeeMembersCount: settingsIn.standbyCommittee.length,
  validatorsCount: settingsIn.validatorsCount,
  millisecondsPerBlock: settingsIn.millisecondsPerBlock,
  memoryPoolMaxTransactions: settingsIn.memoryPoolMaxTransactions,
});

const numIsUint = (num: number) => num >= 0 && num < 2 ** 32 - 1;
const numIsInt = (num: number) => num >= -(2 ** 32 / 2) && num <= 2 ** 32 / 2 - 1;
const numIsByte = (num: number) => num >= 0 && num <= 2 ** 8 - 1;

export const validateProtocolSettings = (settings: ProtocolSettings) => {
  const {
    magic,
    addressVersion,
    committeeMembersCount,
    validatorsCount,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
  } = settings;
  if (
    // tslint:disable: strict-type-predicates
    magic == undefined &&
    addressVersion == undefined &&
    committeeMembersCount == undefined &&
    validatorsCount == undefined &&
    millisecondsPerBlock == undefined &&
    memoryPoolMaxTransactions == undefined
    // tslint:enable: strict-type-predicates
  ) {
    throw new Error('Cannot return an empty settings object');
  }
  if (magic !== undefined && !numIsUint(magic)) {
    throw new InvalidUIntError(magic);
  }
  if (addressVersion !== undefined && !numIsByte(addressVersion)) {
    throw new InvalidByteError(addressVersion);
  }
  if (committeeMembersCount !== undefined && !numIsInt(committeeMembersCount)) {
    throw new InvalidIntError(committeeMembersCount);
  }
  if (validatorsCount !== undefined && !numIsInt(validatorsCount)) {
    throw new InvalidIntError(validatorsCount);
  }
  if (millisecondsPerBlock !== undefined && !numIsUint(millisecondsPerBlock)) {
    throw new InvalidUIntError(millisecondsPerBlock);
  }
  if (memoryPoolMaxTransactions !== undefined && !numIsInt(memoryPoolMaxTransactions)) {
    throw new InvalidIntError(memoryPoolMaxTransactions);
  }

  return settings;
};
