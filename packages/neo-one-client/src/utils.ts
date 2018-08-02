import { common, Param as ScriptBuilderParam, ScriptBuilder } from '@neo-one/client-core';
import { ProcessErrorError, ProcessErrorTrace, processTrace } from '@neo-one/client-switch';
import { deserializeStackItem, StackItem } from '@neo-one/node-vm';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import _ from 'lodash';
import { RawSourceMap } from 'source-map';
import { converters } from './sc/parameters';
import { ActionRaw, Hash160String } from './types';

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

const extractMessageFromStackItem = (stackItem: StackItem): string => {
  const type = stackItem
    .asArray()[0]
    .asBigInteger()
    .toNumber();

  switch (type) {
    case 0:
      return 'undefined';
    case 1:
      return 'null';
    case 2:
      return JSON.stringify(stackItem.asArray()[1].asBoolean());
    case 3:
      return stackItem.asArray()[1].asString();
    case 4:
      return `Symbol(${stackItem.asArray()[1].asString()})`;
    case 5:
      return JSON.stringify(
        stackItem
          .asArray()[1]
          .asBigInteger()
          .toNumber(),
      );
    default:
      return `<unknown type ${type}>`;
  }
};

const extractMessage = (value: Buffer): string => {
  const stackItems = deserializeStackItem(value)
    .asArray()[1]
    .asArray();

  const messages = stackItems.map(extractMessageFromStackItem);

  return messages.join('');
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
    const message = extractMessage(Buffer.from(converters.toByteArray(args[2]), 'hex'));

    return { line, message };
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
