import { Param as ScriptBuilderParam } from '@neo-one/client-core';
import _ from 'lodash';
import {
  InvalidArgumentError,
  InvalidEventError,
  InvocationCallError,
} from '../errors';
import {
  ABIEvent,
  ABIParameter,
  ABIReturn,
  Action,
  ActionRaw,
  ContractParameter,
  EventParameters,
  InvocationResult,
  Param,
  RawInvocationResult,
} from '../types';
import { contractParameters, converters } from './parameters';
import { params as paramCheckers } from './params';

export const convertParameter = ({
  type,
  parameter,
}: {
  type: ABIParameter | ABIReturn;
  parameter: ContractParameter;
}): Param | null => (contractParameters[type.type] as any)(parameter, type);

export const getParametersObject = ({
  abiParameters,
  parameters,
}: {
  abiParameters: ABIParameter[];
  parameters: ContractParameter[];
}): EventParameters => {
  if (abiParameters.length !== parameters.length) {
    throw new InvalidArgumentError(
      `Expected ABI parameters length (${abiParameters.length}) to equal ` +
        `parameters length (${parameters.length})`,
    );
  }

  const zipped = _.zip(abiParameters, parameters) as Array<
    [ABIParameter, ContractParameter]
  >;
  return zipped.reduce((acc: EventParameters, [abiParameter, parameter]) => {
    acc[abiParameter.name] = convertParameter({
      type: abiParameter,
      parameter,
    });

    return acc;
  }, {});
};

export const convertAction = ({
  action,
  events,
}: {
  action: ActionRaw;
  events: { [key: string]: ABIEvent };
}): Action => {
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
    globalIndex: action.globalIndex,
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
}: {
  returnType: ABIReturn;
  result: RawInvocationResult;
}): InvocationResult<Param | null> => {
  const { gasConsumed, gasCost } = result;
  if (result.state === 'FAULT') {
    return {
      state: result.state,
      gasConsumed,
      gasCost,
      message: result.message,
    };
  }

  const contractParameter = result.stack[0];
  let value = null;
  if (contractParameter != null) {
    value = convertParameter({
      type: returnType,
      parameter: contractParameter,
    });
  }

  return { state: result.state, gasConsumed, gasCost, value };
};

export const convertCallResult = ({
  returnType,
  result,
}: {
  returnType: ABIReturn;
  result: RawInvocationResult;
}): Param | null => {
  if (result.state === 'FAULT') {
    throw new InvocationCallError(result.message);
  }

  const contractParameter = result.stack[0];
  let value = null;
  if (contractParameter != null) {
    value = convertParameter({
      type: returnType,
      parameter: contractParameter,
    });
  }

  return value;
};

export const convertParams = ({
  parameters,
  params,
}: {
  parameters: ABIParameter[];
  params: Array<Param | null>;
}): {
  converted: Array<ScriptBuilderParam | null>;
  zipped: Array<[string, Param | null]>;
} => {
  if (parameters.length !== params.length) {
    throw new InvalidArgumentError(
      `Expected parameters length (${parameters.length}) to equal params ` +
        `length (${params.length}).`,
    );
  }

  const zip = _.zip(parameters, params) as Array<[ABIParameter, Param | null]>;
  const converted = zip.map(([parameter, param]) =>
    (paramCheckers[parameter.type] as any)(param, parameter),
  );
  const zipped = zip.map(
    ([parameter, param]) => [parameter.name, param] as [string, Param | null],
  );

  return { converted, zipped };
};
