/* @flow */
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import { VM_STATE, type Param, type UInt160 } from '@neo-one/client-core';

import _ from 'lodash';
import { filter, map } from 'ix/asynciterable/pipe/index';

import type {
  ABI,
  ABIFunction,
  ABIParameter,
  ABIReturn,
  Action,
  ActionFilter,
  AttributeLike,
  ContractParameter,
  Event,
  EventParameters,
  InputLike,
  NumberLike,
  OutputLike,
  ParamLike,
  PrivateKeyLikeOrSign,
  StorageItem,
  TransferLike,
  WitnessLike,
} from './types';
import type BasicClientBase from './BasicClientBase';
import {
  InvokeError,
  InvalidParamError,
  NotificationMissingEventError,
} from './errors';

import converters from './converters';
import paramConverters from './params';

// flowlint-next-line unclear-type:off
type TBasicClientBase = BasicClientBase<any, any, any, any, any, any>;

const convertParameter = ({
  client,
  type,
  parameter,
}: {|
  client: TBasicClientBase,
  type: ABIReturn,
  parameter: ContractParameter,
|}) => {
  if (type === 'Array') {
    return client.parameters.byType.Array.to(
      parameter,
      param => (param: $FlowFixMe).value,
    );
  }
  if (typeof type === 'object' && type.type === 'Integer') {
    return client.parameters.byType.Integer.to(parameter, type.decimals);
  }
  return client.parameters.byType[type].to(parameter);
};

const getParametersObject = ({
  client,
  abiParameters,
  parameters,
}: {|
  client: TBasicClientBase,
  abiParameters: Array<ABIParameter>,
  parameters: Array<ContractParameter>,
|}): EventParameters => {
  if (abiParameters.length !== parameters.length) {
    throw new InvalidParamError(
      `Expected ABI parameters length (${abiParameters.length}) to equal ` +
        `parameters length (${parameters.length})`,
    );
  }

  return _.zip(abiParameters, parameters).reduce(
    (acc, [abiParameter, parameter]) => {
      acc[abiParameter.name] = convertParameter({
        client,
        type:
          abiParameter.type === 'Integer' && abiParameter.decimals != null
            ? {
                type: 'Integer',
                decimals: abiParameter.decimals,
              }
            : abiParameter.type,
        parameter,
      });
      return acc;
    },
    {},
  );
};

const getParams = ({
  client,
  parameters,
  params,
}: {|
  client: TBasicClientBase,
  parameters: Array<ABIParameter>,
  params: Array<ParamLike>,
|}): Array<Param> => {
  if (parameters.length !== params.length) {
    throw new InvalidParamError(
      `Expected parameters length (${parameters.length}) to equal params ` +
        `length (${params.length}).`,
    );
  }

  return _.zip(parameters, params).map(([parameter, param]) => {
    if (parameter.type === 'Integer') {
      return paramConverters[parameter.type](
        client,
        param,
        parameter.decimals == null ? undefined : parameter.decimals,
      );
    }

    return paramConverters[parameter.type](client, param);
  });
};

const createConstantFunction = ({
  client,
  scriptHash,
  func: { name, parameters: parametersIn, returnType },
}: {|
  client: TBasicClientBase,
  scriptHash: UInt160,
  func: ABIFunction,
  // flowlint-next-line unclear-type:off
|}) => async (optionsIn?: {| params?: Array<ParamLike> |}): Promise<any> => {
  const options = optionsIn || {};
  const parameters = parametersIn || [];
  const params = options.params || [];
  const result = await client.testInvokeMethodRaw({
    hash: scriptHash,
    method: name,
    params: [...getParams({ client, parameters, params })],
  });
  if (result.state === VM_STATE.FAULT) {
    throw new InvokeError(
      result.message == null
        ? 'Unknown Script Execution Error'
        : result.message,
    );
  }

  return convertParameter({
    client,
    type: returnType,
    parameter: result.stack[0],
  });
};

const createBasicFunction = ({
  client,
  scriptHash,
  func: { name, parameters: parametersIn },
}: {|
  client: TBasicClientBase,
  scriptHash: UInt160,
  func: ABIFunction,
|}) => async ({
  params: paramsIn,
  privateKey,
  gas,
  inputs,
  outputs,
  attributes,
  scripts,
}: {|
  params?: Array<ParamLike>,
  privateKey: PrivateKeyLikeOrSign,
  gas?: NumberLike,
  inputs?: Array<InputLike>,
  outputs?: Array<OutputLike>,
  attributes?: Array<AttributeLike>,
  scripts?: Array<WitnessLike>,
|}): Promise<string> => {
  const params = paramsIn || [];
  const parameters = parametersIn || [];
  return client.invokeMethodRaw({
    hash: scriptHash,
    method: name,
    params: [...getParams({ client, params, parameters })],
    privateKey,
    gas,
    inputs,
    outputs,
    attributes,
    scripts,
  });
};

const createFunction = ({
  client,
  scriptHash,
  func: { name, parameters: parametersIn, returnType },
}: {|
  client: $FlowFixMe,
  scriptHash: UInt160,
  func: ABIFunction,
|}) => async ({
  params: paramsIn,
  privateKey,
  transfers,
  attributes,
}: {|
  params?: Array<ParamLike>,
  privateKey: PrivateKeyLikeOrSign,
  transfers?: Array<TransferLike>,
  attributes?: Array<AttributeLike>,
|}): Promise<{| txid: string, result: $FlowFixMe |}> => {
  const parameters = parametersIn || [];
  const params = paramsIn || [];
  const { txid, stack } = await client.invokeMethod({
    hash: scriptHash,
    method: name,
    params: [...getParams({ client, params, parameters })],
    privateKey,
    transfers,
    attributes,
  });

  return {
    txid,
    result: convertParameter({
      client,
      type: returnType,
      parameter: stack[0],
    }),
  };
};

export default ({
  abi,
  client: clientIn,
  isBasicClient,
}: {|
  abi: ABI,
  client: TBasicClientBase,
  isBasicClient: boolean,
  // flowlint-next-line unclear-type:off
|}): any => {
  const client = clientIn;
  const scriptHash = converters.hash160(client, abi.hash);

  // flowlint-next-line unclear-type:off
  const smartContract = ({ constant$: {} }: Object);
  abi.functions.forEach(func => {
    if (func.constant) {
      smartContract.constant$[func.name] = createConstantFunction({
        scriptHash,
        client,
        func,
      });
    } else if (isBasicClient) {
      smartContract[func.name] = createBasicFunction({
        scriptHash,
        client,
        func,
      });
    } else {
      smartContract[func.name] = createFunction({
        scriptHash,
        client: (client: $FlowFixMe),
        func,
      });
    }
  });

  if (!isBasicClient) {
    smartContract.iterActions = (
      actionFilterIn?: ActionFilter,
    ): AsyncIterable<Action> => {
      const actionFilter = actionFilterIn || {};
      return (client: $FlowFixMe).iterActions({
        ...actionFilter,
        scriptHash,
      });
    };

    const events = (abi.events || []).reduce((acc, event) => {
      acc[event.name] = event;
      return acc;
    }, {});
    smartContract.iterEvents = (
      actionFilter?: ActionFilter,
    ): AsyncIterable<Event> =>
      AsyncIterableX.from(smartContract.iterActions(actionFilter)).pipe(
        map(action => {
          if (action.type === 'Log') {
            return (null: $FlowFixMe);
          }

          if (action.args.length === 0) {
            throw new NotificationMissingEventError(action);
          }
          const event = client.parameters.toString(action.args[0]);

          return {
            name: event,
            parameters: getParametersObject({
              client,
              abiParameters: events[event].parameters,
              parameters: action.args.slice(1),
            }),
          };
        }),
        filter(Boolean),
      );

    smartContract.iterLogs = (
      actionFilter?: ActionFilter,
    ): AsyncIterable<string> =>
      AsyncIterableX.from(smartContract.iterActions(actionFilter)).pipe(
        map(action => {
          if (action.type === 'Notification') {
            return (null: $FlowFixMe);
          }

          return action.message;
        }),
        filter(Boolean),
      );

    smartContract.iterStorage = (): AsyncIterable<StorageItem> =>
      (client: $FlowFixMe).iterStorage(scriptHash);
  }

  return smartContract;
};
