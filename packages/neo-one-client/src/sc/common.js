/* @flow */
import _ from 'lodash';

import type {
  Action,
  ABIEvent,
  ABIParameter,
  ABIReturn,
  ContractParameter,
  Event,
  EventParameters,
  Log,
  Param,
} from '../types'; // eslint-disable-line
import { InvalidEventError, InvalidArgumentError } from '../errors';

import parameterConverters from './parameters';

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
  action: Action,
  events: { [key: string]: ABIEvent },
|}): Event | Log => {
  if (action.type === 'Log') {
    return action;
  }

  const { args } = action;
  if (args.length === 0) {
    throw new InvalidEventError('Notification had no arguments');
  }

  const event = parameterConverters.String(args[0], { type: 'String' });
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
