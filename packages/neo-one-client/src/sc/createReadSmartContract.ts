import { ScriptBuilderParam } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { filter } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/filter';
import { map } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
import BigNumber from 'bignumber.js';
import { ReadClient } from '../ReadClient';
import {
  ABIEvent,
  ABIFunction,
  ABIParameter,
  Action,
  AddressString,
  BlockFilter,
  Event,
  Log,
  Param,
  RawAction,
  ReadSmartContractAny,
  ReadSmartContractDefinition,
  SourceMaps,
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
  address,
  client,
  func: { name, parameters = [], returnType },
  sourceMaps,
}: {
  readonly address: AddressString;
  readonly client: ReadClient;
  readonly func: ABIFunction;
  readonly sourceMaps?: SourceMaps;
  // tslint:disable-next-line no-any
}) => async (...args: any[]): Promise<Param | undefined> => {
  const { params, monitor } = getParams({
    parameters,
    params: args,
  });

  const receipt = await client.__call(address, name, params, monitor);

  return common.convertCallResult({ returnType, result: receipt.result, actions: receipt.actions, sourceMaps });
};

export const createReadSmartContract = ({
  definition,
  client,
}: {
  readonly definition: ReadSmartContractDefinition;
  readonly client: ReadClient;
}): ReadSmartContractAny => {
  const {
    address,
    abi: { events: abiEvents = [], functions },
    sourceMaps,
  } = definition;
  const events = abiEvents.reduce<{ [key: string]: ABIEvent }>(
    (acc, event) => ({
      ...acc,
      [event.name]: event,
    }),
    {},
  );

  const iterActionsRaw = (blockFilter: BlockFilter = {}): AsyncIterable<RawAction> =>
    AsyncIterableX.from(client.__iterActionsRaw(blockFilter)).pipe(filter((action) => action.address === address));

  const convertAction = (action: RawAction): Action => common.convertAction({ action, events });

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

  const iterStorage = (): AsyncIterable<StorageItem> => client.iterStorage(address);

  return functions.reduce<ReadSmartContractAny>(
    (acc, func) =>
      func.constant === true
        ? {
            ...acc,
            [func.name]: createCall({ client, address, func, sourceMaps }),
          }
        : acc,
    {
      definition,
      iterActions,
      iterEvents,
      iterLogs,
      iterStorage,
      convertAction,
    },
  );
};
