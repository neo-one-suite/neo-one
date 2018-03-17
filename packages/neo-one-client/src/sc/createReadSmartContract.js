/* @flow */
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import BigNumber from 'bignumber.js';
import type { Monitor } from '@neo-one/monitor';
import { type Param as ScriptBuilderParam } from '@neo-one/client-core';

import { filter, map } from 'ix/asynciterable/pipe/index';

import type {
  ABI,
  ABIFunction,
  ABIParameter,
  Action,
  ActionRaw,
  BlockFilter,
  Event,
  Hash160String,
  Log,
  Param,
  ReadSmartContract,
  StorageItem,
} from '../types';
import type ReadClient from '../ReadClient';

import * as common from './common';

const getParams = ({
  parameters,
  params: paramsIn,
}: {|
  parameters: Array<ABIParameter>,
  params: Array<any>,
|}): {| params: Array<?ScriptBuilderParam>, monitor?: Monitor |} => {
  let params = paramsIn;
  const finalArg = params[params.length - 1];
  let monitor;
  if (
    finalArg != null &&
    typeof finalArg === 'object' &&
    !Array.isArray(finalArg) &&
    !BigNumber.isBigNumber(finalArg)
  ) {
    params = params.slice(0, -1);
    monitor = finalArg;
  }

  const { converted } = common.convertParams({ params, parameters });
  return { params: converted, monitor };
};

const createCall = ({
  hash,
  client,
  func: { name, parameters, returnType },
}: {|
  hash: Hash160String,
  client: ReadClient<*>,
  func: ABIFunction,
|}) => async (...args: Array<any>): Promise<?Param> => {
  const { params, monitor } = getParams({
    parameters: parameters || [],
    params: args,
  });
  const result = await client._call(hash, name, params, monitor);
  return common.convertCallResult({ returnType, result });
};

export default ({
  hash,
  abi,
  client,
}: {|
  hash: Hash160String,
  abi: ABI,
  client: ReadClient<*>,
|}): ReadSmartContract => {
  const events = (abi.events || []).reduce((acc, event) => {
    acc[event.name] = event;
    return acc;
  }, {});

  const iterActionsRaw = (filterIn?: BlockFilter): AsyncIterable<ActionRaw> => {
    const blockFilter = filterIn || {};
    return AsyncIterableX.from(client._iterActionsRaw(blockFilter)).pipe(
      filter(action => action.scriptHash === hash),
    );
  };

  const convertAction = (action: ActionRaw): Action =>
    common.convertAction({ action, events });

  const iterActions = (filterIn?: BlockFilter): AsyncIterable<Action> =>
    AsyncIterableX.from(iterActionsRaw(filterIn)).pipe(map(convertAction));

  const iterEvents = (actionFilter?: BlockFilter): AsyncIterable<Event> =>
    AsyncIterableX.from(iterActions(actionFilter)).pipe(
      map(action => {
        if (action.type === 'Log') {
          return (null: $FlowFixMe);
        }

        return action;
      }),
      filter(Boolean),
    );

  const iterLogs = (actionFilter?: BlockFilter): AsyncIterable<Log> =>
    AsyncIterableX.from(iterActions(actionFilter)).pipe(
      map(action => {
        if (action.type === 'Event') {
          return (null: $FlowFixMe);
        }

        return action;
      }),
      filter(Boolean),
    );

  const iterStorage = (): AsyncIterable<StorageItem> =>
    client._iterStorage(hash);

  const smartContract = {
    iterActionsRaw,
    iterActions,
    iterEvents,
    iterLogs,
    iterStorage,
    convertAction,
  };
  abi.functions.forEach(func => {
    if (func.constant) {
      smartContract[func.name] = createCall({ client, hash, func });
    }
  });

  return smartContract;
};
