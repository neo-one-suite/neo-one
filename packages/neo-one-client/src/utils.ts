import { common, Param as ScriptBuilderParam, ScriptBuilder } from '@neo-one/client-core';
import { ProcessErrorError, ProcessErrorTrace, processTrace } from '@neo-one/client-switch';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import _ from 'lodash';
import { RawSourceMap } from 'source-map';
import { converters } from './sc/parameters';
import { ActionRaw, ByteArrayContractParameter, Hash160String } from './types';

export const bigNumberToBN = (value: BigNumber, decimals: number): BN => {
  const dBigNumber = new BigNumber(10 ** decimals);

  return new BN(value.times(dBigNumber).toString(), 10);
};

export const getInvokeMethodInvocationScript = ({
  method,
  params,
}: {
  readonly method: string;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCallInvocation(method, ...params);

  return sb.build();
};

export const getInvokeMethodScript = ({
  hash,
  method,
  params,
}: {
  readonly hash: Hash160String;
  readonly method: string;
  readonly params: ReadonlyArray<ScriptBuilderParam | undefined>;
}): Buffer => {
  const sb = new ScriptBuilder();
  sb.emitAppCall(common.stringToUInt160(hash), method, ...params);

  return sb.build();
};

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

export interface ConsoleLog {
  readonly line: number;
  readonly message: string;
}

const extractLogArg = ([typeIn, value]: [string, string]): string => {
  const type = Buffer.from(typeIn, 'hex').toString('utf8');

  const byteArray: ByteArrayContractParameter = { type: 'ByteArray', value };

  switch (type) {
    case 'Signature':
      return converters.toSignature(byteArray);
    case 'Hash160':
      return converters.toHash160(byteArray);
    case 'Hash256':
      return converters.toHash256(byteArray);
    case 'PublicKey':
      return converters.toPublicKey(byteArray);
    case 'ByteArray':
      return converters.toByteArray(byteArray);
    case 'String':
      return converters.toString(byteArray);
    case 'Integer':
      return converters.toInteger(byteArray, { type: 'Integer', decimals: 0 }).toString(10);
    case 'Boolean':
      return JSON.stringify(converters.toBoolean(byteArray));
    default:
      return '(failed to parse log argument)';
  }
};

const extractLog = (action: ActionRaw): ConsoleLog | undefined => {
  if (action.type === 'Log') {
    return undefined;
  }

  const args = action.args;
  try {
    const event = converters.toString(args[0]);
    if (event !== 'console.log') {
      return undefined;
    }

    const line = converters.toInteger(args[1], { type: 'Integer', decimals: 0 }).toNumber();
    const messageArgs = converters
      .toArray(args[2], { type: 'Array', value: { type: 'Array', value: { type: 'ByteArray' } } })
      // tslint:disable-next-line no-unnecessary-callback-wrapper no-any
      .map((value: any) => extractLogArg(value));

    return {
      line,
      message: messageArgs.join(' '),
    };
  } catch {
    return undefined;
  }
};

export const extractConsoleLogs = (actions: ReadonlyArray<ActionRaw>): ReadonlyArray<ConsoleLog> => {
  const mutableLogs: ConsoleLog[] = [];
  // tslint:disable-next-line no-loop-statement
  for (const action of actions) {
    const log = extractLog(action);

    if (log !== undefined) {
      mutableLogs.push(log);
    }
  }

  return mutableLogs;
};

export const createConsoleLogMessages = async (
  actions: ReadonlyArray<ActionRaw>,
  sourceMap: RawSourceMap,
): Promise<ReadonlyArray<string>> => {
  const logs = extractConsoleLogs(actions);
  const traces = await processTrace({ trace: logs, sourceMap });
  const zipped = utils.zip(logs, traces);

  return zipped.map(([{ message }, trace]) => {
    if (trace === undefined) {
      return message;
    }

    const { token, file, line, column } = trace;

    return `${message}\n  at ${token} (${file}:${line}${column === undefined ? '' : `:${column}`})`;
  });
};
