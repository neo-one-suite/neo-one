// tslint:disable no-any no-object-mutation
import { Configuration } from '@neo-one/cli-common';
import {
  common,
  ContractParameter,
  crypto,
  deserializeParam,
  Event,
  InvocationResult,
  InvokeReceipt,
  Log,
  RawAction,
  RawInvocationResult,
  RawInvokeReceipt,
  serializeParam,
} from '@neo-one/client-common';
import { PublishReceipt } from '@neo-one/client-full-core';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as nodePath from 'path';
import stringify from 'safe-stable-stringify';
import { Action } from './types';

const serializeAction = async (action: Action) => {
  const params = await Promise.all(action.params);

  return common.uInt256ToString(
    crypto.hash256(
      Buffer.from(
        stringify({
          contract: action.contract,
          method: action.method,
          params: params.map(serializeParam),
          transfer:
            action.transfer === undefined
              ? undefined
              : {
                  ...action.transfer,
                  amount: action.transfer.amount.toString(10),
                },
          hash: action.hash,
        }),
        'utf8',
      ),
    ),
  );
};

const getActionResultFile = (config: Configuration) => nodePath.resolve(config.artifacts.path, 'actions.json');
const loadActionResults = async (config: Configuration) => {
  try {
    const contents = await fs.readFile(getActionResultFile(config), 'utf8');

    return JSON.parse(contents);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {};
    }

    throw err;
  }
};

const serializeInvocationResult = <TValue>(
  result: InvocationResult<TValue>,
  serializeValue: (value: TValue) => any,
) => {
  const commonObj = {
    ...result,
    gasConsumed: result.gasConsumed.toString(10),
  };

  if (result.state === 'HALT') {
    return {
      ...commonObj,
      value: serializeValue(result.value),
    };
  }

  return commonObj;
};

const deserializeInvocationResult = <TValue>(
  result: any,
  deserializeValue: (value: any) => TValue,
): InvocationResult<TValue> => {
  const commonObj = {
    ...result,
    gasConsumed: new BigNumber(result.gasConsumed),
    gasCost: new BigNumber(result.gasCost),
  };

  if (result.state === 'HALT') {
    return {
      ...commonObj,
      value: deserializeValue(result.value),
    };
  }

  return commonObj;
};

const serializePublishReceipt = (receipt: PublishReceipt) => ({
  ...receipt,
  globalIndex: receipt.globalIndex.toString(10),
  result: serializeInvocationResult(receipt.result, (value) => value),
});

const deserializePublishReceipt = (receipt: any): PublishReceipt => ({
  ...receipt,
  globalIndex: new BigNumber(receipt.globalIndex),
  result: deserializeInvocationResult(receipt.result, (value) => value),
});

const serializeContractParameter = (param: ContractParameter) =>
  param.type === 'Integer'
    ? {
        ...param,
        value: param.value.toString(10),
      }
    : param;

const deserializeContractParameter = (param: ContractParameter) =>
  param.type === 'Integer'
    ? {
        ...param,
        value: new BN(param.value),
      }
    : param;

const serializeRawInvocationResult = (result: RawInvocationResult) => ({
  ...result,
  gasConsumed: result.gasConsumed.toString(10),
  stack: result.stack.map(serializeContractParameter),
});

const serializeRawInvokeReceipt = (result: RawInvokeReceipt) => ({
  ...result,
  gasConsumed: result.gasConsumed.toString(10),
  stack: typeof result.stack === 'string' ? [] : result.stack.map(serializeContractParameter),
});

const deserializeRawInvocationResult = (result: any): RawInvocationResult => ({
  ...result,
  gasConsumed: new BigNumber(result.gasConsumed),
  gasCost: new BigNumber(result.gasCost),
  stack: result.stack.map(deserializeContractParameter),
});

const serializeRawAction = (action: RawAction) =>
  action.type === 'Notification'
    ? {
        ...action,
        args: typeof action.state === 'string' ? [] : action.state.map(serializeContractParameter),
        // globalIndex: action.globalIndex.toString(10),
      }
    : {
        ...action,
        // globalIndex: action.globalIndex.toString(10),
      };

const deserializeRawAction = (action: any): RawAction =>
  action.type === 'Notification'
    ? {
        ...action,
        args: action.args.map(deserializeContractParameter),
        globalIndex: new BigNumber(action.globalIndex),
      }
    : {
        ...action,
        globalIndex: new BigNumber(action.globalIndex),
      };

const serializeLog = (log: Log) => ({
  ...log,
  // globalIndex: log.globalIndex.toString(10),
});

const deserializeLog = (log: any): Log => ({
  ...log,
  globalIndex: new BigNumber(log.globalIndex),
});

const serializeEvent = (event: Event) => ({
  ...event,
  // globalIndex: new BigNumber(event.globalIndex),
  parameters: _.fromPairs(Object.entries(event.parameters).map(([k, v]) => [k, serializeParam(v)])),
});

const deserializeEvent = (event: any): Event => ({
  ...event,
  globalIndex: new BigNumber(event.globalIndex),
  parameters: _.fromPairs(Object.entries(event.parameters).map(([k, v]) => [k, deserializeParam(v as any)])),
});

const serializeInvokeReceipt = (receipt: InvokeReceipt) => ({
  ...receipt,
  globalIndex: receipt.globalIndex.toString(10),
  result: serializeInvocationResult(receipt.result, (value) => value),
  events: receipt.events.map(serializeEvent),
  logs: receipt.logs.map(serializeLog),
  raw: {
    ...receipt.raw,
    globalIndex: receipt.raw.globalIndex.toString(10),
    actions: [...receipt.raw.logs, ...receipt.raw.notifications].map(serializeRawAction),
    result: serializeRawInvokeReceipt(receipt.raw),
  },
});

const deserializeInvokeReceipt = (receipt: any): InvokeReceipt => ({
  ...receipt,
  globalIndex: new BigNumber(receipt.globalIndex),
  result: deserializeInvocationResult(receipt.result, (value) => value),
  events: receipt.events.map(deserializeEvent),
  logs: receipt.logs.map(deserializeLog),
  raw: {
    ...receipt.raw,
    globalIndex: new BigNumber(receipt.raw.globalIndex),
    actions: receipt.raw.actions.map(deserializeRawAction),
    result: deserializeRawInvocationResult(receipt.raw.result),
  },
});

const saveReceipt = async (config: Configuration, network: string, action: Action, receipt: any) => {
  const [actionResults, actionHash] = await Promise.all([loadActionResults(config), serializeAction(action)]);
  if (actionResults[network] === undefined) {
    actionResults[network] = {};
  }

  actionResults[network][actionHash] = receipt;

  const file = getActionResultFile(config);
  await fs.ensureDir(nodePath.dirname(file));
  await fs.writeFile(file, stringify(actionResults, undefined, 2));
};

export const savePublishReceipt = async (
  config: Configuration,
  network: string,
  action: Action,
  receipt: PublishReceipt,
) => saveReceipt(config, network, action, serializePublishReceipt(receipt));

export const saveInvokeReceipt = async (
  config: Configuration,
  network: string,
  action: Action,
  receipt: InvokeReceipt,
) => saveReceipt(config, network, action, serializeInvokeReceipt(receipt));

export const getActionResult = async (
  config: Configuration,
  network: string,
  action: Action,
): Promise<InvokeReceipt | PublishReceipt | undefined> => {
  const [actionResults, actionHash] = await Promise.all([loadActionResults(config), serializeAction(action)]);
  if (actionResults[network] === undefined) {
    return undefined;
  }

  if (actionResults[network][actionHash] === undefined) {
    return undefined;
  }

  const result = actionResults[network][actionHash];

  return action.method === 'deploy' ? deserializePublishReceipt(result) : deserializeInvokeReceipt(action);
};
