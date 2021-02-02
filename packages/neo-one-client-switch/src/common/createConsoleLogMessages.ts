import { common, RawAction, scriptHashToAddress, smartContractConverters as converters } from '@neo-one/client-common';
import { assertArrayLikeStackItem, BinaryReader, deserializeStackItem, StackItem } from '@neo-one/node-core';
import { utils } from '@neo-one/utils';
import _ from 'lodash';
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

const getArray = (stackItem: StackItem): readonly StackItem[] => assertArrayLikeStackItem(stackItem).array;

// tslint:disable-next-line no-any
const extractValueFromStackItem = (stackItem: StackItem): any => {
  const type = getArray(stackItem)[0].getInteger().toNumber();

  switch (type) {
    case 1:
      return undefined;
    case 2:
      // tslint:disable-next-line no-null-keyword
      return null;
    case 3:
      return getArray(stackItem)[1].getBoolean();
    case 4:
      return getArray(stackItem)[1].getString();
    case 5:
      return `Symbol(${getArray(stackItem)[1].getString()})`;
    case 6:
      return getArray(stackItem)[1].getInteger().toString(10);
    case 7:
      return _.fromPairs(
        utils.zip(
          getArray(getArray(getArray(stackItem)[1])[0]).map(extractValueFromStackItem),
          getArray(getArray(getArray(stackItem)[1])[1]).map(extractValueFromStackItem),
        ),
      );
    case 8:
      return getArray(getArray(stackItem)[1]).map(extractValueFromStackItem);
    case 9:
      return getArray(stackItem)[1].getBuffer().toString('hex');
    case 10:
      // tslint:disable-next-line no-any
      return new Map<any, any>(
        // tslint:disable-next-line no-any
        getArray(getArray(stackItem)[1]).map<any>((value: any) => getArray(value).map(extractValueFromStackItem)),
      );
    case 11:
      return new Set(getArray(getArray(stackItem)[1]).map(extractValueFromStackItem));
    default:
      return `<unknown type ${type}>`;
  }
};

const extractMessageFromStackItem = (stackItem: StackItem): string => {
  const value = extractValueFromStackItem(stackItem);

  return typeof value === 'string' ? value : JSON.stringify(inspect(value));
};

const extractMessage = (value: Buffer): string => {
  const stackItems = getArray(getArray(deserializeStackItem(new BinaryReader(value), 16, 34))[1]);

  const messages = stackItems.map(extractMessageFromStackItem);

  return messages.join('');
};

const extractLog = (action: RawAction): ConsoleLog | undefined => {
  if (action.type === 'Log') {
    return undefined;
  }

  const address = scriptHashToAddress(common.uInt160ToString(action.scriptHash));
  const args = action.state;
  try {
    const event = action.eventName;
    if (event !== 'console.log') {
      return undefined;
    }
    if (typeof args === 'string') {
      return { address, line: -1, message: args };
    }

    const line = converters.toInteger(args[1], { type: 'Integer', decimals: 0 }).toNumber();
    const message = extractMessage(Buffer.from(converters.toBuffer(args[2]), 'hex'));

    return { address, line, message };
  } catch {
    return undefined;
  }
};

const extractConsoleLogs = (actions: readonly RawAction[]): readonly ConsoleLog[] => {
  const mutableLogs: ConsoleLog[] = [];
  // TODO: this should be removed when we're more confident in our types
  // tslint:disable-next-line: strict-type-predicates
  if (actions === undefined) {
    return mutableLogs;
  }
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
