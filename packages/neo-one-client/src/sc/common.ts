import { contractParameters, converters, ScriptBuilderParam } from '@neo-one/client-core';
import { processActionsAndMessage, processConsoleLogMessages } from '@neo-one/client-switch';
import _ from 'lodash';
import { InvalidContractArgumentCountError, InvalidEventError, InvocationCallError } from '../errors';
import {
  ABIEvent,
  ABIParameter,
  ABIReturn,
  Action,
  ContractParameter,
  EventParameters,
  InvocationResult,
  Param,
  RawAction,
  RawInvocationResult,
  SourceMaps,
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
    throw new InvalidContractArgumentCountError(abiParameters.length, parameters.length);
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
  readonly action: RawAction;
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
    address: action.address,
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
  sourceMaps,
}: {
  readonly returnType: ABIReturn;
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<RawAction>;
  readonly sourceMaps?: Promise<SourceMaps>;
}): Promise<InvocationResult<Param | undefined>> => {
  const { gasConsumed, gasCost } = result;
  if (result.state === 'FAULT') {
    const message = await processActionsAndMessage({
      actions,
      message: result.message,
      sourceMaps,
    });

    return {
      state: result.state,
      gasConsumed,
      gasCost,
      message,
    };
  }

  await processConsoleLogMessages({ actions, sourceMaps });

  const contractParameter = result.stack[0];
  const value = convertParameter({
    type: returnType,
    parameter: contractParameter,
  });

  return { state: result.state, gasConsumed, gasCost, value };
};

export const convertCallResult = async ({
  returnType,
  result: resultIn,
  actions,
  sourceMaps,
}: {
  readonly returnType: ABIReturn;
  readonly result: RawInvocationResult;
  readonly actions: ReadonlyArray<RawAction>;
  readonly sourceMaps?: Promise<SourceMaps>;
}): Promise<Param | undefined> => {
  const result = await convertInvocationResult({ returnType, result: resultIn, actions, sourceMaps });
  if (result.state === 'FAULT') {
    throw new InvocationCallError(result.message);
  }

  return result.value;
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
  const nonOptionalParameters = parameters.filter((param) => !param.optional);
  if (params.length < nonOptionalParameters.length) {
    throw new InvalidContractArgumentCountError(nonOptionalParameters.length, params.length);
  }

  const additionalParams = parameters.length - params.length;

  const zip = _.zip(parameters, params.concat(_.range(0, additionalParams).map(() => undefined))) as Array<
    [ABIParameter, Param]
  >;
  const converted = zip.map(([parameter, param]) =>
    // tslint:disable-next-line no-any
    (paramCheckers[parameter.type] as any)(parameter.name, param, parameter),
  );
  // tslint:disable-next-line no-useless-cast
  const zipped = zip.map(([parameter, param]) => [parameter.name, param] as [string, Param | undefined]);

  return { converted, zipped };
};
