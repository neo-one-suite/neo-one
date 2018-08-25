import { ScriptBuilderParam } from '@neo-one/client-core';
import { utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { Client } from '../Client';
import { NoContractDeployedError } from '../errors';
import { events as traceEvents } from '../trace';
import {
  ABIEvent,
  ABIFunction,
  ABIParameter,
  Action,
  AddressString,
  Event,
  InvokeReceipt,
  Log,
  NetworkType,
  Param,
  RawAction,
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
  readonly network: NetworkType;
  readonly address: AddressString;
} => {
  const finalArg = args[args.length - 1] as {} | undefined;
  let params = args;
  let optionsIn: TransactionOptions = {};
  if (
    finalArg !== undefined &&
    typeof finalArg === 'object' &&
    !Array.isArray(finalArg) &&
    !BigNumber.isBigNumber(finalArg)
  ) {
    params = args.slice(0, -1);
    optionsIn = finalArg;
  }

  const currentAccount = client.getCurrentAccount();
  const options =
    optionsIn.from === undefined && currentAccount !== undefined
      ? {
          ...optionsIn,
          from: currentAccount.id,
        }
      : optionsIn;
  const network = options.from === undefined ? client.getCurrentNetwork() : options.from.network;

  const contractNetwork = networks[network] as SmartContractNetworkDefinition | undefined;
  if (contractNetwork === undefined) {
    throw new NoContractDeployedError(network);
  }

  const { converted, zipped } = common.convertParams({ params, parameters });

  return {
    params: converted,
    paramsZipped: zipped,
    options,
    network,
    address: contractNetwork.address,
  };
};

const convertActions = ({
  actions,
  events,
}: {
  readonly actions: ReadonlyArray<RawAction>;
  readonly events: ReadonlyArray<ABIEvent>;
}): ReadonlyArray<Action> => {
  const eventsObj = traceEvents.concat(events).reduce<{ [key: string]: ABIEvent }>(
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
  const { params, network, address, options } = getParamsAndOptions({
    definition,
    parameters,
    args,
    client,
  });

  const receipt = await client.__call(network, address, name, params, options.monitor);

  return common.convertCallResult({
    returnType,
    result: receipt.result,
    actions: receipt.actions,
    sourceMaps: definition.sourceMaps,
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
  const { params, paramsZipped, options, address } = getParamsAndOptions({
    definition,
    parameters,
    args,
    client,
  });

  const result = await client.__invoke(address, name, params, paramsZipped, verify, options, definition.sourceMaps);

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
        sourceMaps: definition.sourceMaps,
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
          address: definition.networks[network].address,
          abi: definition.abi,
          sourceMaps: definition.sourceMaps,
        }),
      definition,
    },
  );
