import { Param as ScriptBuilderParam } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import { filter } from 'ix/asynciterable/pipe/filter';
import { map } from 'ix/asynciterable/pipe/map';
import { RawSourceMap } from 'source-map';
import { ReadClient } from '../ReadClient';
import {
  ABIEvent,
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
  ReadSmartContractDefinition,
  StorageItem,
} from '../types';
import * as common from './common';

const getParams = ({
  parameters,
  params: paramsIn,
}: {
  readonly parameters: ReadonlyArray<ABIParameter>;
  // tslint:disable-next-line no-any
  readonly params: ReadonlyArray<any>;
}): { readonly params: ReadonlyArray<ScriptBuilderParam | undefined>; readonly monitor?: Monitor } => {
  let params = paramsIn;
  const finalArg = params[params.length - 1];
  let monitor;
  if (
    finalArg != undefined &&
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
  func: { name, parameters = [], returnType },
  sourceMap,
}: {
  readonly hash: Hash160String;
  readonly client: ReadClient;
  readonly func: ABIFunction;
  readonly sourceMap?: RawSourceMap;
  // tslint:disable-next-line no-any
}) => async (...args: any[]): Promise<Param | undefined> => {
  const { params, monitor } = getParams({
    parameters,
    params: args,
  });

  const result = await client.call(hash, name, params, monitor);

  return common.convertCallResult({ returnType, result, sourceMap });
};

export const createReadSmartContract = ({
  definition: {
    hash,
    abi: { events: abiEvents = [], functions },
    sourceMap,
  },
  client,
}: {
  readonly definition: ReadSmartContractDefinition;
  readonly client: ReadClient;
}): ReadSmartContract => {
  const events = abiEvents.reduce<{ [key: string]: ABIEvent }>(
    (acc, event) => ({
      ...acc,
      [event.name]: event,
    }),
    {},
  );

  const iterActionsRaw = (blockFilter: BlockFilter = {}): AsyncIterable<ActionRaw> =>
    // tslint:disable-next-line possible-timing-attack
    AsyncIterableX.from(client.iterActionsRaw(blockFilter)).pipe(filter((action) => action.scriptHash === hash));

  const convertAction = (action: ActionRaw): Action => common.convertAction({ action, events });

  const iterActions = (filterIn?: BlockFilter): AsyncIterable<Action> =>
    AsyncIterableX.from(iterActionsRaw(filterIn)).pipe(map(convertAction));

  const iterEvents = (actionFilter?: BlockFilter): AsyncIterable<Event> =>
    AsyncIterableX.from(iterActions(actionFilter)).pipe(
      map((action) => {
        if (action.type === 'Log') {
          return undefined;
        }

        return action;
      }),
      filter(Boolean),
    );

  const iterLogs = (actionFilter?: BlockFilter): AsyncIterable<Log> =>
    AsyncIterableX.from(iterActions(actionFilter)).pipe(
      map((action) => {
        if (action.type === 'Event') {
          return undefined;
        }

        return action;
      }),
      filter(Boolean),
    );

  const iterStorage = (): AsyncIterable<StorageItem> => client.iterStorage(hash);

  return functions.reduce<ReadSmartContract>(
    (acc, func) =>
      func.constant === true
        ? {
            ...acc,
            [func.name]: createCall({ client, hash, func, sourceMap }),
          }
        : acc,
    {
      iterActionsRaw,
      iterActions,
      iterEvents,
      iterLogs,
      iterStorage,
      convertAction,
    },
  );
};
