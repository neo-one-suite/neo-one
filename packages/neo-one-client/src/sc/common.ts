import { contractParameters, converters, ScriptBuilderParam } from '@neo-one/client-core';
import { processActionsAndMessage } from '@neo-one/client-switch';
import _ from 'lodash';
import { RawSourceMap } from 'source-map';
import { InvalidArgumentError, InvalidEventError, InvocationCallError } from '../errors';
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
import { params as paramCheckers } from './params';

export const convertParameter = ({
  type,
  parameter,
}: {
  readonly type: ABIParameter | ABIReturn;
  readonly parameter: ContractParameter;
  // tslint:disable-next-line no-any
}): Param | undefined => (contractParameters[type.type] as any)(parameter, type);

export const getParametersObject = ({
  abiParameters,
  parameters,
}: {
  readonly abiParameters: ReadonlyArray<ABIParameter>;
  readonly parameters: ReadonlyArray<ContractParameter>;
}): EventParameters => {
  if (abiParameters.length !== parameters.length) {
    throw new InvalidArgumentError(
      `Expected ABI parameters length (${abiParameters.length}) to equal ` + `parameters length (${parameters.length})`,
    );
  }

  const zipped = _.zip(abiParameters, parameters) as Array<[ABIParameter, ContractParameter]>;

  return zipped.reduce<EventParameters>(
    (acc, [abiParameter, parameter]) => ({
      ...acc,
      [abiParameter.name]: convertParameter({
        type: abiParameter,
        parameter,
      }),
    }),
    {},
  );
};

export const convertAction = ({
  action,
  events,
}: {
  readonly action: ActionRaw;
  readonly events: { readonly [K in string]?: ABIEvent };
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
  if (eventSpec === undefined) {
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

export const convertInvocationResult = async ({
  returnType,
  result,
  actions,
  sourceMap,
}: {
  readonly returnType: ABIReturn;
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<ActionRaw>;
  readonly sourceMap?: RawSourceMap;
}): Promise<InvocationResult<Param | undefined>> => {
  const { gasConsumed, gasCost } = result;
  if (result.state === 'FAULT') {
    const message = await processActionsAndMessage({
      actions,
      message: result.message,
      sourceMap,
    });

    return {
      state: result.state,
      gasConsumed,
      gasCost,
      message,
    };
  }

  const contractParameter = result.stack[0];
  let value;
  // tslint:disable-next-line strict-type-predicates
  if (contractParameter !== undefined) {
    value = convertParameter({
      type: returnType,
      parameter: contractParameter,
    });
  }

  return { state: result.state, gasConsumed, gasCost, value };
};

export const convertCallResult = async ({
  returnType,
  result,
  actions,
  sourceMap,
}: {
  readonly returnType: ABIReturn;
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<ActionRaw>;
  readonly sourceMap?: RawSourceMap;
}): Promise<Param | undefined> => {
  if (result.state === 'FAULT') {
    const message = await processActionsAndMessage({
      actions,
      message: result.message,
      sourceMap,
    });

    throw new InvocationCallError(message);
  }

  const contractParameter = result.stack[0];
  let value;
  // tslint:disable-next-line strict-type-predicates
  if (contractParameter !== undefined) {
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
  readonly parameters: ReadonlyArray<ABIParameter>;
  readonly params: ReadonlyArray<Param | undefined>;
}): {
  readonly converted: ReadonlyArray<ScriptBuilderParam | undefined>;
  readonly zipped: ReadonlyArray<[string, Param | undefined]>;
} => {
  if (parameters.length !== params.length) {
    throw new InvalidArgumentError(
      `Expected parameters length (${parameters.length}) to equal params ` + `length (${params.length}).`,
    );
  }

  const zip = _.zip(parameters, params) as Array<[ABIParameter, Param | undefined]>;
  // tslint:disable-next-line no-any
  const converted = zip.map(([parameter, param]) => (paramCheckers[parameter.type] as any)(param, parameter));
  // tslint:disable-next-line no-useless-cast
  const zipped = zip.map(([parameter, param]) => [parameter.name, param] as [string, Param | undefined]);

  return { converted, zipped };
};
