import { ScriptBuilderParam } from '@neo-one/client-core';
import { utils as commonUtils } from '@neo-one/utils';
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
  InvocationTransaction,
  InvokeClaimTransactionOptions,
  InvokeReceipt,
  InvokeSendReceiveTransactionOptions,
  Log,
  NetworkType,
  Param,
  RawAction,
  SmartContractAny,
  SmartContractDefinition,
  SmartContractNetworkDefinition,
  TransactionReceipt,
  TransactionResult,
} from '../types';
import * as common from './common';

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
  const finalArg = args[args.length - 1] as {} | undefined;
  let params = args;
  let optionsIn: InvokeSendReceiveTransactionOptions | InvokeClaimTransactionOptions = {};
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
}) => async (
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
    return client.__invokeClaim(address, name, params, paramsZipped, options);
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
