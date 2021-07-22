import { common, ECPoint } from '@neo-one/client-common';
import { func, Params, Source, TSQL } from '@neo-one/edge';
import { Settings, VMProtocolSettingsIn } from '@neo-one/node-core';
import path from 'path';
import { InvalidByteError, InvalidIntError, InvalidUIntError } from './errors';
import { DefaultMethods, DispatcherFunc } from './types';

const directory = path.basename(__dirname);
const APP_ROOT =
  directory === 'cjs' || directory === 'esm' ? path.resolve(__dirname, '..', '..') : path.resolve(__dirname, '..');
const CSHARP_APP_ROOT = process.env.EDGE_APP_ROOT ?? path.resolve(APP_ROOT, 'lib', 'bin', 'Debug', 'netcoreapp3.0');

export const constants = {
  APP_ROOT,
  CSHARP_APP_ROOT,
};

type EdgeOptions = (() => void) | string | Params | Source | TSQL;

export const createCSharpDispatchInvoke = <Methods extends DefaultMethods>(
  options: EdgeOptions,
): DispatcherFunc<Methods> => {
  if (process.env.EDGE_APP_ROOT === undefined) {
    // tslint:disable-next-line: no-object-mutation
    process.env.EDGE_APP_ROOT = CSHARP_APP_ROOT;
  }

  if (process.env.EDGE_USE_CORECLR === undefined) {
    // tslint:disable-next-line: no-object-mutation
    process.env.EDGE_USE_CORECLR = '1';
  }

  const invokeFunction = func(options);

  return (input) => invokeFunction(input, true);
};

export const blockchainSettingsToProtocolSettings = (settingsIn: Settings): VMProtocolSettingsIn => ({
  network: settingsIn.network,
  addressVersion: settingsIn.addressVersion,
  standbyCommittee: settingsIn.standbyCommittee.map((ecpoint: ECPoint) => common.ecPointToString(ecpoint)),
  committeeMembersCount: settingsIn.standbyCommittee.length,
  validatorsCount: settingsIn.validatorsCount,
  millisecondsPerBlock: settingsIn.millisecondsPerBlock,
  memoryPoolMaxTransactions: settingsIn.memoryPoolMaxTransactions,
  maxTraceableBlocks: settingsIn.maxTraceableBlocks,
  initialGasDistribution: settingsIn.initialGasDistribution.toString(),
  maxTransactionsPerBlock: settingsIn.maxTransactionsPerBlock,
  nativeUpdateHistory: settingsIn.nativeUpdateHistory,
});

const numIsUint = (num: number) => num >= 0 && num < 2 ** 32 - 1;
const numIsInt = (num: number) => num >= -(2 ** 32 / 2) && num <= 2 ** 32 / 2 - 1;
const numIsByte = (num: number) => num >= 0 && num <= 2 ** 8 - 1;

export const validateProtocolSettings = (settings: VMProtocolSettingsIn) => {
  const {
    network,
    addressVersion,
    committeeMembersCount,
    validatorsCount,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    maxTraceableBlocks,
    maxTransactionsPerBlock,
  } = settings;
  if (network !== undefined && !numIsUint(network)) {
    throw new InvalidUIntError(network);
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
  if (maxTraceableBlocks !== undefined && !numIsUint(maxTraceableBlocks)) {
    throw new InvalidUIntError(maxTraceableBlocks);
  }
  if (maxTransactionsPerBlock !== undefined && !numIsUint(maxTransactionsPerBlock)) {
    throw new InvalidUIntError(maxTransactionsPerBlock);
  }

  return { ...settings, initialGasDistribution: settings.initialGasDistribution?.toString() };
};
