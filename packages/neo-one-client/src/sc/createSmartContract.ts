import { ScriptBuilderParam } from '@neo-one/client-core';
import { utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { Client } from '../Client';
import { NoAccountError, NoContractDeployedError } from '../errors';
import {
  ABIEvent,
  ABIFunction,
  ABIParameter,
  Action,
  ActionRaw,
  Event,
  Hash160String,
  InvokeReceipt,
  Log,
  Param,
  SmartContractAny,
  SmartContractDefinition,
  SmartContractNetworkDefinition,
  TransactionOptions,
  TransactionResult,
} from '../types';
import * as common from './common';

const getParamsAndOptions = ({
  definition: { networks },
  parameters,
  args,
  client,
}: {
  readonly definition: SmartContractDefinition;
  readonly parameters: ReadonlyArray<ABIParameter>;
  // tslint:disable-next-line no-any
  readonly args: ReadonlyArray<any>;
  readonly client: Client;
}): {
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
  readonly paramsZipped: ReadonlyArray<[string, Param | undefined]>;
  readonly options: TransactionOptions;
  readonly hash: Hash160String;
} => {
  const finalArg = args[args.length - 1] as {} | undefined;
  let params = args;
  let options: TransactionOptions = {};
  if (
    finalArg !== undefined &&
    typeof finalArg === 'object' &&
    !Array.isArray(finalArg) &&
    !BigNumber.isBigNumber(finalArg)
  ) {
    params = args.slice(0, -1);
    options = finalArg;
  }

  let from = options.from;
  if (from === undefined) {
    const currentAccount = client.getCurrentAccount();
    if (currentAccount === undefined) {
      throw new NoAccountError();
    }
    from = currentAccount.id;
    options = {
      ...options,
      from,
    };
  }

  const contractNetwork = networks[from.network] as SmartContractNetworkDefinition | undefined;
  if (contractNetwork === undefined) {
    throw new NoContractDeployedError(from.network);
  }

  const { converted, zipped } = common.convertParams({ params, parameters });

  return {
    params: converted,
    paramsZipped: zipped,
    options,
    hash: contractNetwork.hash,
  };
};

const convertActions = ({
  actions,
  events,
}: {
  readonly actions: ReadonlyArray<ActionRaw>;
  readonly events: ReadonlyArray<ABIEvent>;
}): ReadonlyArray<Action> => {
  const eventsObj = events.reduce<{ [key: string]: ABIEvent }>(
    (acc, event) => ({
      ...acc,
      [event.name]: event,
    }),
    {},
  );

  return actions.map((action) =>
    common.convertAction({
      action,
      events: eventsObj,
    }),
  );
};

const createCall = ({
  definition,
  client,
  func: { name, parameters = [], returnType },
}: {
  readonly definition: SmartContractDefinition;
  readonly client: Client;
  readonly func: ABIFunction;
  // tslint:disable-next-line no-any
}) => async (...args: any[]): Promise<Param | undefined> => {
  const { params, options, hash } = getParamsAndOptions({
    definition,
    parameters,
    args,
    client,
  });

  const receipt = await client.__call(hash, name, params, options);

  return common.convertCallResult({
    returnType,
    result: receipt.result,
    actions: receipt.actions,
    sourceMap: definition.sourceMap,
  });
};

const filterEvents = (actions: ReadonlyArray<Event | Log>): ReadonlyArray<Event> =>
  actions.map((action) => (action.type === 'Event' ? action : undefined)).filter(commonUtils.notNull);
const filterLogs = (actions: ReadonlyArray<Event | Log>): ReadonlyArray<Log> =>
  actions.map((action) => (action.type === 'Log' ? action : undefined)).filter(commonUtils.notNull);

const createInvoke = ({
  definition,
  client,
  func: { name, parameters = [], returnType, verify = false },
}: {
  readonly definition: SmartContractDefinition;
  readonly client: Client;
  readonly func: ABIFunction;
  // tslint:disable-next-line no-any
}) => async (...args: any[]): Promise<TransactionResult<InvokeReceipt>> => {
  const { params, paramsZipped, options, hash } = getParamsAndOptions({
    definition,
    parameters,
    args,
    client,
  });

  const result = await client.__invoke(hash, name, params, paramsZipped, verify, options, definition.sourceMap);

  return {
    transaction: result.transaction,
    confirmed: async (getOptions?): Promise<InvokeReceipt> => {
      const receipt = await result.confirmed(getOptions);
      const { events = [] } = definition.abi;
      const actions = convertActions({
        actions: receipt.actions,
        events,
      });

      const invocationResult = await common.convertInvocationResult({
        returnType,
        result: receipt.result,
        actions: receipt.actions,
        sourceMap: definition.sourceMap,
      });

      return {
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
        result: invocationResult,

        events: filterEvents(actions),
        logs: filterLogs(actions),
      };
    },
  };
};

export const createSmartContract = ({
  definition,
  client,
}: {
  readonly definition: SmartContractDefinition;
  readonly client: Client;
}): SmartContractAny =>
  definition.abi.functions.reduce<SmartContractAny>(
    (acc, func) => ({
      ...acc,
      [func.name]:
        func.constant === true
          ? createCall({
              definition,
              client,
              func,
            })
          : createInvoke({
              definition,
              client,
              func,
            }),
    }),
    {
      read: (network) =>
        client.read(network).smartContract({
          hash: definition.networks[network].hash,
          abi: definition.abi,
          sourceMap: definition.sourceMap,
        }),
      definition,
    },
  );
