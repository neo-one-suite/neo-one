import { ScriptBuilderParam } from '@neo-one/client-core';
import { utils, utils as commonUtils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { Client } from '../Client';
import {
  CannotClaimContractError,
  CannotSendFromContractError,
  CannotSendToContractError,
  NoContractDeployedError,
} from '../errors';
import { events as traceEvents } from '../trace';
import {
  ABIEvent,
  ABIFunction,
  ABIParameter,
  Action,
  AddressString,
  ClaimTransaction,
  Event,
  GetOptions,
  InvocationTransaction,
  InvokeClaimTransactionOptions,
  InvokeReceipt,
  InvokeSendReceiveTransactionOptions,
  Log,
  NetworkType,
  Param,
  RawAction,
  Return,
  SmartContractAny,
  SmartContractDefinition,
  SmartContractNetworkDefinition,
  TransactionReceipt,
  TransactionResult,
} from '../types';
import * as common from './common';

// tslint:disable-next-line no-any
const isOptionsArg = (finalArg: any) =>
  finalArg !== undefined &&
  typeof finalArg === 'object' &&
  !Array.isArray(finalArg) &&
  !BigNumber.isBigNumber(finalArg) &&
  // tslint:disable-next-line no-any
  finalArg.name === undefined;

const getParamsAndOptions = ({
  definition: { networks },
  parameters,
  args,
  send,
  receive,
  claim,
  client,
}: {
  readonly definition: SmartContractDefinition;
  readonly parameters: ReadonlyArray<ABIParameter>;
  // tslint:disable-next-line no-any
  readonly args: ReadonlyArray<any>;
  readonly send: boolean;
  readonly receive: boolean;
  readonly claim: boolean;
  readonly client: Client;
}): {
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
  readonly paramsZipped: ReadonlyArray<[string, Param | undefined]>;
  readonly options: InvokeSendReceiveTransactionOptions | InvokeClaimTransactionOptions;
  readonly network: NetworkType;
  readonly address: AddressString;
} => {
  const hasRest = parameters.length > 0 && parameters[parameters.length - 1].rest;
  const optionsArgIndex = hasRest ? parameters.length - 1 : parameters.length;
  const maybeOptionsArg = args[optionsArgIndex] as {} | undefined;
  let params = args;
  let optionsIn: InvokeSendReceiveTransactionOptions | InvokeClaimTransactionOptions = {};
  if (isOptionsArg(maybeOptionsArg)) {
    params = args.slice(0, optionsArgIndex).concat(args.slice(optionsArgIndex + 1));
    // tslint:disable-next-line no-any
    optionsIn = maybeOptionsArg as any;
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
  // tslint:disable-next-line no-any
  if ((options as any).sendFrom !== undefined && !send) {
    throw new CannotSendFromContractError(contractNetwork.address);
  }
  // tslint:disable-next-line no-any
  if ((options as any).sendTo !== undefined && !receive) {
    throw new CannotSendToContractError(contractNetwork.address);
  }
  // tslint:disable-next-line no-any
  if ((options as any).claimAll && !claim) {
    throw new CannotClaimContractError(contractNetwork.address);
  }

  const { converted, zipped } = common.convertParams({
    params,
    parameters,
    senderAddress: currentAccount === undefined ? undefined : currentAccount.id.address,
  });

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

  return actions
    .map((action) => {
      const converted = common.convertAction({
        action,
        events: eventsObj,
      });

      return typeof converted === 'string' ? undefined : converted;
    })
    .filter(utils.notNull);
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
}) => async (...args: any[]): Promise<Return | undefined> => {
  const { params, network, address, options } = getParamsAndOptions({
    definition,
    parameters,
    args,
    send: false,
    receive: false,
    claim: false,
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
  func: { name, parameters = [], returnType, send = false, receive = false, claim = false },
}: {
  readonly definition: SmartContractDefinition;
  readonly client: Client;
  readonly func: ABIFunction;
}) => {
  const invoke = async (
    // tslint:disable-next-line no-any
    ...args: any[]
  ): Promise<
    TransactionResult<InvokeReceipt, InvocationTransaction> | TransactionResult<TransactionReceipt, ClaimTransaction>
  > => {
    const { params, paramsZipped, options, address } = getParamsAndOptions({
      definition,
      parameters,
      args,
      send,
      receive,
      claim,
      client,
    });

    if (claim) {
      return client.__invokeClaim(address, name, params, paramsZipped, options, definition.sourceMaps);
    }

    const result = await client.__invoke(
      address,
      name,
      params,
      paramsZipped,
      send || receive,
      options,
      definition.sourceMaps,
    );

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
  // tslint:disable-next-line no-any no-object-mutation
  (invoke as any).confirmed = async (...args: any[]) => {
    // tslint:disable-next-line no-any
    const finalArg = args[args.length - 1];
    let options: GetOptions | undefined;
    if (isOptionsArg(finalArg)) {
      options = finalArg;
    }
    const result = await invoke(...args);
    const receipt = await result.confirmed(options);

    return { ...receipt, transaction: result.transaction };
  };

  return invoke;
};

export const createSmartContract = ({
  definition,
  client,
}: {
  readonly definition: SmartContractDefinition;
  readonly client: Client;
}): SmartContractAny =>
  definition.abi.functions.reduce<SmartContractAny>(
    (acc, func) =>
      common.addForward(func, {
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
