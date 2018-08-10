import { ActionRaw, converters } from '@neo-one/client-core';
import _ from 'lodash';
import { ProcessErrorError, ProcessErrorTrace } from '../common';

const extractError = (action: ActionRaw): ProcessErrorError | undefined => {
  if (action.type === 'Log') {
    return undefined;
  }

  const args = action.args;
  try {
    const event = converters.toString(args[0]);
    if (event !== 'error') {
      return undefined;
    }

    return {
      line: converters.toInteger(args[2], { type: 'Integer', decimals: 0 }).toNumber(),
      message: converters.toString(args[1]),
    };
  } catch {
    return undefined;
  }
};

const extractTrace = (action: ActionRaw): ProcessErrorTrace | undefined => {
  if (action.type === 'Log') {
    return undefined;
  }

  const args = action.args;
  try {
    const event = converters.toString(args[0]);
    if (event !== 'trace') {
      return undefined;
    }

    return {
      line: converters.toInteger(args[1], { type: 'Integer', decimals: 0 }).toNumber(),
    };
  } catch {
    return undefined;
  }
};

const extractTraces = (actions: ReadonlyArray<ActionRaw>): ReadonlyArray<ProcessErrorTrace> => {
  const mutableTraces: ProcessErrorTrace[] = [];
  // tslint:disable-next-line no-loop-statement
  for (const action of actions) {
    const trace = extractTrace(action);
    if (trace === undefined) {
      return mutableTraces;
    }

    mutableTraces.push(trace);
  }

  return mutableTraces;
};

const DEFAULT_ERROR = {
  trace: [],
};

export const extractErrorTrace = (
  actions: ReadonlyArray<ActionRaw>,
): {
  readonly error?: ProcessErrorError;
  readonly trace: ReadonlyArray<ProcessErrorTrace>;
} => {
  const lastError = _.reverse([...actions])
    .map((action) => ({ action, error: extractError(action) }))
    .find(({ error }) => error !== undefined);
  if (lastError === undefined) {
    return DEFAULT_ERROR;
  }

  return {
    error: lastError.error,
    trace: extractTraces(actions.slice(actions.indexOf(lastError.action) + 1)),
  };
};
