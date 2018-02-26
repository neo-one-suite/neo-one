/* @flow */
import BigNumber from 'bignumber.js';
import { type Param as ScriptBuilderParam } from '@neo-one/client-core';

import type {
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
} from '../types';
import type Client from '../Client';
import { NoAccountError, NoContractDeployedError } from '../errors';

import * as common from './common';

const getParamsAndOptions = ({
  definition: { networks },
  parameters,
  args,
  client,
}: {|
  definition: SmartContractDefinition,
  parameters: Array<ABIParameter>,
  args: Array<any>,
  client: Client<*>,
|}): {|
  params: Array<?ScriptBuilderParam>,
  paramsZipped: Array<[string, ?Param]>,
  options: any,
  hash: Hash160String,
|} => {
  const finalArg = args[args.length - 1];
  let params = args;
  let options = {};
  if (
    finalArg != null &&
    typeof finalArg === 'object' &&
    !Array.isArray(finalArg) &&
    !BigNumber.isBigNumber(finalArg)
  ) {
    params = args.slice(0, -1);
    options = finalArg;
  }

  if (options.from == null) {
    const from = client.getCurrentAccount();
    if (from == null) {
      throw new NoAccountError();
    }
    options = {
      ...options,
      from: from.id,
    };
  }

  const contractNetwork = networks[options.from.network];
  if (contractNetwork == null) {
    throw new NoContractDeployedError(options.from.network);
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
}: {|
  actions: Array<ActionRaw>,
  events: Array<ABIEvent>,
|}): Array<Action> => {
  const eventsObj = events.reduce((acc, event) => {
    acc[event.name] = event;
    return acc;
  }, {});
  return actions.map(action =>
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
}: {|
  definition: SmartContractDefinition,
  client: Client<*>,
  func: ABIFunction,
|}) => async (...args: Array<any>): Promise<?Param> => {
  const { params, options, hash } = getParamsAndOptions({
    definition,
    parameters: parameters || [],
    args,
    client,
  });
  const result = await client._call(hash, name, params, options);
  return common.convertCallResult({ returnType, result });
};

const filterEvents = (actions: Array<Event | Log>): Array<Event> =>
  actions
    .map(action => (action.type === 'Event' ? action : null))
    .filter(Boolean);
const filterLogs = (actions: Array<Event | Log>): Array<Log> =>
  actions
    .map(action => (action.type === 'Log' ? action : null))
    .filter(Boolean);

const createInvoke = ({
  definition,
  client,
  func: { name, parameters, returnType, verify },
}: {|
  definition: SmartContractDefinition,
  client: Client<*>,
  func: ABIFunction,
|}) => async (
  ...args: Array<any>
): Promise<TransactionResult<InvokeReceipt>> => {
  const { params, paramsZipped, options, hash } = getParamsAndOptions({
    definition,
    parameters: parameters || [],
    args,
    client,
  });

  const result = await client._invoke(
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

export default ({
  definition,
  client,
}: {|
  definition: SmartContractDefinition,
  client: Client<*>,
|}): SmartContract => {
  const smartContract = ({}: Object);
  definition.abi.functions.forEach(func => {
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
