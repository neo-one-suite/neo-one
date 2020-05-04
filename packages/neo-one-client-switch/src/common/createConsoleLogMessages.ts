import { RawAction, smartContractConverters as converters } from '@neo-one/client-common';
import { deserializeStackItem, StackItem } from '@neo-one/node-vm';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
import { SourceMaps } from '../common';
import { initializeSourceMap } from './initializeSourceMap';
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
const inspect = (value: any, wrapString = false): any => {
  if (value === null) {
    return wrapString ? JSON.stringify(value) : value;
  }

  if (Array.isArray(value)) {
    return wrapString ? JSON.stringify(value) : value;
  }

  if (value instanceof Map) {
    return `Map { ${[...value.entries()]
      .map(([key, val]) => `${inspect(key, true)} => ${inspect(val, true)}`)
      .join(', ')} }`;
  }

  if (value instanceof Set) {
    return `Set { ${[...value].map((val) => inspect(val, true)).join(', ')} }`;
  }

  if (typeof value === 'string') {
    return wrapString ? `'${value}'` : value;
  }

  if (typeof value === 'function') {
    return '[Function]';
  }

  if (typeof value === 'object') {
    // tslint:disable-next-line no-any
    const result = _.fromPairs(Object.entries(value).map(([key, val]) => [key, inspect(val)]));

    return wrapString ? JSON.stringify(result) : result;
  }

  return wrapString ? JSON.stringify(value) : value;
};

// tslint:disable-next-line no-any
const extractValueFromStackItem = (stackItem: StackItem): any => {
  const type = stackItem.asArray()[0].asBigIntegerUnsafe().toNumber();

  switch (type) {
    case 1:
      return undefined;
    case 2:
      // tslint:disable-next-line no-null-keyword
      return null;
    case 3:
      return stackItem.asArray()[1].asBoolean();
    case 4:
      return stackItem.asArray()[1].asString();
    case 5:
      return `Symbol(${stackItem.asArray()[1].asString()})`;
    case 6:
      return stackItem.asArray()[1].asBigIntegerUnsafe().toString(10);
    case 7:
      return _.fromPairs(
        utils.zip(
          stackItem.asArray()[1].asArray()[0].asArray().map(extractValueFromStackItem),
          stackItem.asArray()[1].asArray()[1].asArray().map(extractValueFromStackItem),
        ),
      );
    case 8:
      return stackItem.asArray()[1].asArray().map(extractValueFromStackItem);
    case 9:
      return stackItem.asArray()[1].asBuffer().toString('hex');
    case 10:
      // tslint:disable-next-line no-any
      return new Map<any, any>(
        stackItem
          .asArray()[1]
          .asArray()
          // tslint:disable-next-line no-any
          .map<any>((value) => value.asArray().map(extractValueFromStackItem)),
      );
    case 11:
      return new Set(stackItem.asArray()[1].asArray().map(extractValueFromStackItem));
    default:
      return `<unknown type ${type}>`;
  }
};

const extractMessageFromStackItem = (stackItem: StackItem): string => {
  const value = extractValueFromStackItem(stackItem);

  return typeof value === 'string' ? value : JSON.stringify(inspect(value));
};

const extractMessage = (value: Buffer): string => {
  const stackItems = deserializeStackItem(value).asArray()[1].asArray();

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

const extractConsoleLogs = (actions: readonly RawAction[]): readonly ConsoleLog[] => {
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
  actions: readonly RawAction[],
  sourceMaps: SourceMaps = {},
  { bare = false, onlyFileName = false }: LogOptions = { bare: false, onlyFileName: false },
): Promise<readonly string[]> => {
  initializeSourceMap();
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
