/* @flow */
import { type Param as ScriptBuilderParam } from '@neo-one/client-core';

import _ from 'lodash';

import type {
  Action,
  ActionRaw,
  ABIEvent,
  ABIParameter,
  ABIReturn,
  ContractParameter,
  EventParameters,
  InvocationResult,
  Param,
  RawInvocationResult,
} from '../types';
import {
  InvalidEventError,
  InvalidArgumentError,
  InvocationCallError,
} from '../errors';

import parameterConverters, { converters } from './parameters';
import paramCheckers from './params';

export const convertParameter = ({
  type,
  parameter,
}: {|
  type: ABIParameter | ABIReturn,
  parameter: ContractParameter,
|}): ?Param => parameterConverters[type.type](parameter, (type: $FlowFixMe));

export const getParametersObject = ({
  abiParameters,
  parameters,
}: {|
  abiParameters: Array<ABIParameter>,
  parameters: Array<ContractParameter>,
|}): EventParameters => {
  if (abiParameters.length !== parameters.length) {
    throw new InvalidArgumentError(
      `Expected ABI parameters length (${abiParameters.length}) to equal ` +
        `parameters length (${parameters.length})`,
    );
  }

  return _.zip(abiParameters, parameters).reduce(
    (acc, [abiParameter, parameter]) => {
      acc[abiParameter.name] = convertParameter({
        type: abiParameter,
        parameter,
      });
      return acc;
    },
    {},
  );
};

export const convertAction = ({
  action,
  events,
}: {|
  action: ActionRaw,
  events: { [key: string]: ABIEvent },
|}): Action => {
  if (action.type === 'Log') {
    return action;
  }

  const { args } = action;
  if (args.length === 0) {
    throw new InvalidEventError('Notification had no arguments');
  }

  const event = converters.toString(args[0]);
  const eventSpec = events[event];
  if (eventSpec == null) {
    throw new InvalidEventError(`Unknown event ${event}`);
  }

  return {
    version: action.version,
    blockIndex: action.blockIndex,
    blockHash: action.blockHash,
    transactionIndex: action.transactionIndex,
    transactionHash: action.transactionHash,
    index: action.index,
    scriptHash: action.scriptHash,
    type: 'Event',
    name: event,
    parameters: getParametersObject({
      abiParameters: eventSpec.parameters,
      parameters: args.slice(1),
    }),
  };
};

export const convertInvocationResult = ({
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
    value = convertParameter({
      type: returnType,
      parameter: value,
    });
  }

  return { state: result.state, gasConsumed, value };
};

export const convertCallResult = ({
  returnType,
  result,
}: {|
  returnType: ABIReturn,
  result: RawInvocationResult,
|}): ?Param => {
  if (result.state === 'FAULT') {
    throw new InvocationCallError(result.message);
  }

  let value = result.stack[0];
  if (value != null) {
    value = convertParameter({
      type: returnType,
      parameter: value,
    });
  }

  return value;
};

export const convertParams = ({
  parameters,
  params,
}: {|
  parameters: Array<ABIParameter>,
  params: Array<?Param>,
|}): {|
  converted: Array<?ScriptBuilderParam>,
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
