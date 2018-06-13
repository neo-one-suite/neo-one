import BigNumber from 'bignumber.js';
import { Param as ScriptBuilderParam } from '@neo-one/client-core';
import { utils as commonUtils } from '@neo-one/utils';
import {
  Action,
  ActionRaw,
  ABIEvent,
  ABIFunction,
  ABIParameter,
  Event,
  GetOptions,
  Hash160String,
  InvokeReceipt,
  Log,
  Param,
  SmartContract,
  SmartContractDefinition,
  TransactionResult,
  TransactionOptions,
  UserAccountID,
} from '../types';
import { Client } from '../Client';
import { NoAccountError, NoContractDeployedError } from '../errors';
import * as common from './common';

const getParamsAndOptions = ({
  definition: { networks },
  parameters,
  args,
  client,
}: {
  definition: SmartContractDefinition;
  parameters: ABIParameter[];
  args: any[];
  client: Client<any>;
}): {
  params: Array<ScriptBuilderParam | null>;
  paramsZipped: Array<[string, Param | null]>;
  options: any;
  hash: Hash160String;
} => {
  const finalArg = args[args.length - 1];
  let params = args;
  let options: TransactionOptions = {};
  if (
    finalArg != null &&
    typeof finalArg === 'object' &&
    !Array.isArray(finalArg) &&
    !BigNumber.isBigNumber(finalArg)
  ) {
    params = args.slice(0, -1);
    options = finalArg;
  }

  let from: UserAccountID | undefined = options.from;
  if (from == null) {
    const currentAccount = client.getCurrentAccount();
    if (currentAccount == null) {
      throw new NoAccountError();
    }
    from = currentAccount.id;
    options = {
      ...options,
      from,
    };
  }

  const contractNetwork = networks[from.network];
  if (contractNetwork == null) {
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
  actions: ActionRaw[];
  events: ABIEvent[];
}): Action[] => {
  const eventsObj = events.reduce((acc: { [key: string]: ABIEvent }, event) => {
    acc[event.name] = event;
    return acc;
  }, {});
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
  func: { name, parameters, returnType },
}: {
  definition: SmartContractDefinition;
  client: Client<any>;
  func: ABIFunction;
}) => async (...args: any[]): Promise<Param | null> => {
  const { params, options, hash } = getParamsAndOptions({
    definition,
    parameters: parameters || [],
    args,
    client,
  });

  const result = await client.call(hash, name, params, options);
  return common.convertCallResult({ returnType, result });
};

const filterEvents = (actions: Array<Event | Log>): Event[] =>
  actions
    .map((action) => (action.type === 'Event' ? action : null))
    .filter(commonUtils.notNull);
const filterLogs = (actions: Array<Event | Log>): Log[] =>
  actions
    .map((action) => (action.type === 'Log' ? action : null))
    .filter(commonUtils.notNull);

const createInvoke = ({
  definition,
  client,
  func: { name, parameters, returnType, verify },
}: {
  definition: SmartContractDefinition;
  client: Client<any>;
  func: ABIFunction;
}) => async (...args: any[]): Promise<TransactionResult<InvokeReceipt>> => {
  const { params, paramsZipped, options, hash } = getParamsAndOptions({
    definition,
    parameters: parameters || [],
    args,
    client,
  });

  const result = await client.invoke(
    hash,
    name,
    params,
    paramsZipped,
    !!verify,
    options,
  );

  return {
    transaction: result.transaction,
    confirmed: async (getOptions?: GetOptions): Promise<InvokeReceipt> => {
      const receipt = await result.confirmed(getOptions);
      const actions = convertActions({
        actions: receipt.actions,
        events: definition.abi.events || [],
      });

      return {
        blockIndex: receipt.blockIndex,
        blockHash: receipt.blockHash,
        transactionIndex: receipt.transactionIndex,
        result: common.convertInvocationResult({
          returnType,
          result: receipt.result,
        }),

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
  definition: SmartContractDefinition;
  client: Client<any>;
}): SmartContract => {
  const smartContract: SmartContract = {};
  definition.abi.functions.forEach((func) => {
    if (func.constant) {
      smartContract[func.name] = createCall({
        definition,
        client,
        func,
      });
    } else {
      smartContract[func.name] = createInvoke({
        definition,
        client,
        func,
      });
    }
  });

  return smartContract;
};
