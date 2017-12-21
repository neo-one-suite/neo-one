/* @flow */
import _ from 'lodash';

import type {
  ABI,
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
  TransactionResult,
} from '../types'; // eslint-disable-line
import type Client from '../Client';
import { InvalidArgumentError } from '../errors';

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
  parameters,
  args,
}: {|
  parameters: Array<ABIParameter>,
  // flowlint-next-line unclear-type:off
  args: Array<any>,
|}): {|
  params: Array<?ParamInternal>,
  paramsZipped: Array<[string, ?Param]>,
  // flowlint-next-line unclear-type:off
  options: any,
|} => {
  if (args.length === 0) {
    return { params: [], paramsZipped: [], options: undefined };
  }

  const finalArg = args[args.length - 1];
  let params = args;
  let options;
  if (
    typeof finalArg === 'object' &&
    !Array.isArray(finalArg) &&
    finalArg.isBigNumber !== true
  ) {
    params = args.slice(0, -1);
    options = finalArg;
  }

  const { converted, zipped } = convertParams({ params, parameters });
  return {
    params: converted,
    paramsZipped: zipped,
    options: options || {},
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
  client,
  hash,
  func: { name, parameters, returnType },
}: {|
  client: Client<*>,
  hash: Hash160String,
  func: ABIFunction,
  // flowlint-next-line unclear-type:off
|}) => async (...args: Array<any>): Promise<InvocationResult<?Param>> => {
  const { params, options } = getParamsAndOptions({
    parameters: parameters || [],
    args,
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
  abi,
  client,
  func: { name, parameters, returnType },
}: {|
  abi: ABI,
  client: Client<*>,
  func: ABIFunction,
|}) => async (
  // flowlint-next-line unclear-type:off
  ...args: Array<any>
): Promise<TransactionResult<InvokeReceipt>> => {
  const { params, paramsZipped, options } = getParamsAndOptions({
    parameters: parameters || [],
    args,
  });
  const result = await client._invoke(
    abi.hash,
    name,
    params,
    paramsZipped,
    options,
  );
  return {
    transaction: result.transaction,
    confirmed: async (getOptions?: GetOptions): Promise<InvokeReceipt> => {
      const receipt = await result.confirmed(getOptions);
      const actions = convertActions({
        actions: receipt.actions,
        events: abi.events || [],
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
  abi,
  client,
}: {|
  abi: ABI,
  client: Client<*>,
|}): SmartContract => {
  // flowlint-next-line unclear-type:off
  const smartContract = ({}: Object);
  abi.functions.forEach(func => {
    if (func.constant) {
      smartContract[func.name] = createCall({
        hash: abi.hash,
        client,
        func,
      });
    } else {
      smartContract[func.name] = createInvoke({
        abi,
        client,
        func,
      });
    }
  });

  return smartContract;
};
