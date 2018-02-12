/* @flow */
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import { type Param as ScriptBuilderParam } from '@neo-one/client-core';

import { filter, map } from 'ix/asynciterable/pipe/index';

import type {
  ABI,
  ABIFunction,
  ABIParameter,
  BlockFilter,
  Event,
  Hash160String,
  InvocationResult,
  Log,
  Param,
  ReadSmartContract,
  StorageItem,
} from '../types'; // eslint-disable-line
import type ReadClient from '../ReadClient';

import * as common from './common';

const getParams = ({
  parameters,
  params,
}: {|
  parameters: Array<ABIParameter>,
  params: Array<any>,
|}): Array<?ScriptBuilderParam> => {
  const { converted } = common.convertParams({ params, parameters });
  return converted;
};

const createCall = ({
  hash,
  client,
  func: { name, parameters, returnType },
}: {|
  hash: Hash160String,
  client: ReadClient<*>,
  func: ABIFunction,
|}) => async (...args: Array<any>): Promise<InvocationResult<?Param>> => {
  const params = getParams({
    parameters: parameters || [],
    params: args,
  });
  const result = await client._call(hash, name, params);
  return common.convertInvocationResult({ returnType, result });
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

  const iterActions = (filterIn?: BlockFilter): AsyncIterable<Event | Log> => {
    const blockFilter = filterIn || {};
    return AsyncIterableX.from(client._iterActions(blockFilter)).pipe(
      filter(action => action.scriptHash === hash),
      map(action => common.convertAction({ action, events })),
    );
  };

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

  const smartContract = { iterActions, iterEvents, iterLogs, iterStorage };
  abi.functions.forEach(func => {
    if (func.constant) {
      smartContract[func.name] = createCall({ client, hash, func });
    }
  });

  return smartContract;
};
