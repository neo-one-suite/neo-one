import { common, RawAction, scriptHashToAddress, smartContractConverters as converters } from '@neo-one/client-common';
import _ from 'lodash';
import { ProcessErrorError, ProcessErrorTrace } from './processError';

const extractError = (action: RawAction): ProcessErrorError | undefined => {
  if (action.type === 'Log') {
    return undefined;
  }

  const address = scriptHashToAddress(common.uInt160ToString(action.scriptHash));
  const args = action.state;

  if (typeof args === 'string') {
    return { address, line: -1, message: args };
  }

  try {
    const event = action.eventName;
    if (event !== 'error') {
      return undefined;
    }

    return {
      address,
      line: converters.toInteger(args[2], { type: 'Integer', decimals: 0 }).toNumber(),
      message: converters.toString(args[1]),
    };
  } catch {
    return undefined;
  }
};

const extractTrace = (action: RawAction): ProcessErrorTrace | undefined => {
  if (action.type === 'Log') {
    return undefined;
  }

  const address = scriptHashToAddress(common.uInt160ToString(action.scriptHash));
  const args = action.state;

  if (typeof args === 'string') {
    return { address, line: -1 };
  }

  try {
    const event = converters.toString(args[0]);
    if (event !== 'trace') {
      return undefined;
    }

    return {
      address,
      line: converters.toInteger(args[1], { type: 'Integer', decimals: 0 }).toNumber(),
    };
  } catch {
    return undefined;
  }
};

const extractTraces = (actions: readonly RawAction[]): readonly ProcessErrorTrace[] => {
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
  actions: readonly RawAction[],
): {
  readonly error?: ProcessErrorError;
  readonly trace: readonly ProcessErrorTrace[];
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
