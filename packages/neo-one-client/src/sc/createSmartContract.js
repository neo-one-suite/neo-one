/* @flow */
import _ from 'lodash';

import type {
  Action,
  ABIEvent,
  ABIFunction,
  ABIParameter,
  ABIReturn,
  Event,
  GetOptions,
  Hash160String,
  InvokeReceipt,
  InvocationResult,
  RawInvocationResult,
  Log,
  Param,
  ParamInternal,
  SmartContract,
  SmartContractDefinition,
  TransactionResult,
} from '../types'; // eslint-disable-line
import type Client from '../Client';
import {
  InvalidArgumentError,
  NoAccountError,
  NoContractDeployedError,
} from '../errors';

import * as common from './common';
import paramCheckers from './params';

const convertParams = ({
  parameters,
  params,
}: {|
  parameters: Array<ABIParameter>,
  params: Array<?Param>,
|}): {|
  converted: Array<?ParamInternal>,
  zipped: Array<[string, ?Param]>,
|} => {
  if (parameters.length !== params.length) {
    throw new InvalidArgumentError(
      `Expected parameters length (${parameters.length}) to equal params ` +
        `length (${params.length}).`,
    );
  }

  const converted = _.zip(parameters, params).map(([parameter, param]) =>
    paramCheckers[parameter.type](param, (parameter: $FlowFixMe)),
  );
  const zipped = _.zip(parameters, params).map(([parameter, param]) => [
    parameter.name,
    param,
  ]);

  return { converted, zipped };
};

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
  params: Array<?ParamInternal>,
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
    finalArg.isBigNumber !== true
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

  const { converted, zipped } = convertParams({ params, parameters });
  return {
    params: converted,
    paramsZipped: zipped,
    options: options || {},
    hash: contractNetwork.hash,
  };
};

const convertInvocationResult = ({
  returnType,
  result,
}: {|
  returnType: ABIReturn,
  result: RawInvocationResult,
|}): InvocationResult<?Param> => {
  const { gasConsumed } = result;
  if (result.state === 'FAULT') {
    return { state: result.state, gasConsumed, message: result.message };
  }

  let value = result.stack[0];
  if (value != null) {
    value = common.convertParameter({
      type: returnType,
      parameter: value,
    });
  }

  return { state: result.state, gasConsumed, value };
};

const convertActions = ({
  actions,
  events,
}: {|
  actions: Array<Action>,
  events: Array<ABIEvent>,
|}): Array<Event | Log> => {
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
|}) => async (...args: Array<any>): Promise<InvocationResult<?Param>> => {
  const { params, options, hash } = getParamsAndOptions({
    definition,
    parameters: parameters || [],
    args,
    client,
  });
  const result = await client._call(hash, name, params, options);
  return convertInvocationResult({ returnType, result });
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
        result: convertInvocationResult({ returnType, result: receipt.result }),
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
