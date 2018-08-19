import { converters, RawAction } from '@neo-one/client-core';
import { deserializeStackItem, StackItem } from '@neo-one/node-vm';
import { utils } from '@neo-one/utils';
import { SourceMaps } from '../common';
import { processTrace } from './processTrace';

export interface LogOptions {
  readonly bare?: boolean;
  readonly onlyFileName?: boolean;
}

interface ConsoleLog {
  readonly address: string;
  readonly line: number;
  readonly message: string;
}

// tslint:disable-next-line no-any
const extractValueFromStackItem = (stackItem: StackItem): any => {
  const type = stackItem
    .asArray()[0]
    .asBigInteger()
    .toNumber();

  switch (type) {
    case 0:
      return undefined;
    case 1:
      // tslint:disable-next-line no-null-keyword
      return null;
    case 2:
      return stackItem.asArray()[1].asBoolean();
    case 3:
      return stackItem.asArray()[1].asString();
    case 4:
      return `Symbol(${stackItem.asArray()[1].asString()})`;
    case 5:
      return stackItem
        .asArray()[1]
        .asBigInteger()
        .toNumber();
    case 6:
      return '<console.log(object) is not supported>';
    case 7:
      return stackItem
        .asArray()[1]
        .asArray()
        .map(extractValueFromStackItem);
    case 8:
      return stackItem
        .asArray()[1]
        .asBuffer()
        .toString('hex');
    default:
      return `<unknown type ${type}>`;
  }
};

const extractMessageFromStackItem = (stackItem: StackItem): string => {
  const value = extractValueFromStackItem(stackItem);

  return typeof value === 'string' ? value : JSON.stringify(value);
};

const extractMessage = (value: Buffer): string => {
  const stackItems = deserializeStackItem(value)
    .asArray()[1]
    .asArray();

  const messages = stackItems.map(extractMessageFromStackItem);

  return messages.join('');
};

const extractLog = (action: RawAction): ConsoleLog | undefined => {
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
    const message = extractMessage(Buffer.from(converters.toBuffer(args[2]), 'hex'));

    return { address: action.address, line, message };
  } catch {
    return undefined;
  }
};

const extractConsoleLogs = (actions: ReadonlyArray<RawAction>): ReadonlyArray<ConsoleLog> => {
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
  actions: ReadonlyArray<RawAction>,
  sourceMaps: SourceMaps = {},
  { bare = false, onlyFileName = false }: LogOptions = { bare: false, onlyFileName: false },
): Promise<ReadonlyArray<string>> => {
  const logs = extractConsoleLogs(actions);
  if (bare) {
    return logs.map(({ message }) => message);
  }
  const traces = await processTrace({ trace: logs, sourceMaps, onlyFileName });
  const zipped = utils.zip(logs, traces);

  return zipped.map(([{ message }, trace]) => {
    if (trace === undefined) {
      return message;
    }

    const { token, file, line, column } = trace;

    return `${message}\n  at ${token} (${file}:${line}${column === undefined ? '' : `:${column}`})`;
  });
};
