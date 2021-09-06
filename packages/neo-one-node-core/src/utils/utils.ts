import { BinaryReader, InvalidFormatError, utils as clientUtils, WildcardContainerJSON } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { randomBytes } from 'crypto';
import _ from 'lodash';
import { StackItem } from '../StackItems';
import { StorageItem } from '../StorageItem';
import { executionLimits } from '../vm';
import { deserializeStackItem } from './deserializeStackItem';

const toASCII = (bytes: Buffer) => {
  let result = '';
  _.range(bytes.length).forEach((i) => {
    result += String.fromCharCode(bytes.readUInt8(i));
  });

  return result;
};

const toUTF8 = (bytes: Buffer) => bytes.toString('utf8');

const randomUInt64 = (): BN => new BN(randomBytes(8).toString('hex'), 16);

const toKeyString = (clazz: { readonly name: string }, toKey: () => string) => () => `${clazz.name}:${toKey()}`;

function lazyAsync<Input, Value>(getValue: (input: Input) => Promise<Value>): (input: Input) => Promise<Value> {
  let valuePromise: Promise<Value> | undefined;

  return async (input) => {
    if (valuePromise === undefined) {
      valuePromise = getValue(input);
    }

    return valuePromise;
  };
}

function lazyOrValue<Value>(getValue: (() => Value) | Value): () => Value {
  // tslint:disable-next-line no-any
  let settings: any =
    typeof getValue === 'function' ? { type: 'lazy', getValue } : { type: 'evaluated', value: getValue };

  return () => {
    if (settings.type === 'lazy') {
      settings = { type: 'evaluated', value: settings.getValue() };
    }

    return settings.value;
  };
}

function weightedAverage(
  input: ReadonlyArray<{
    readonly value: number;
    readonly weight: BigNumber;
  }>,
): number {
  let sumWeight = new BigNumber(0);
  let sumValue = new BigNumber(0);
  input.forEach((value) => {
    sumWeight = sumWeight.plus(value.weight);
    sumValue = sumValue.plus(value.weight.times(value.value));
  });

  if (sumValue.isEqualTo(0) || sumWeight.isEqualTo(0)) {
    return 0;
  }

  return sumValue.div(sumWeight).integerValue(BigNumber.ROUND_FLOOR).toNumber();
}

function weightedFilter<T>(
  input: readonly T[],
  startIn: number,
  endIn: number,
  getValueIn: (value: T) => BN,
): ReadonlyArray<readonly [T, BigNumber]> {
  const start = new BigNumber(startIn);
  const end = new BigNumber(endIn);
  const getValue = (value: T) => new BigNumber(getValueIn(value).toString(10));
  const amount = input.reduce((acc, value) => acc.plus(getValue(value)), new BigNumber(0));

  let sum = new BigNumber(0);
  let current = new BigNumber(0);
  const mutableResult: Array<readonly [T, BigNumber]> = [];
  // tslint:disable-next-line no-loop-statement
  for (const value of input) {
    if (current.gte(end)) {
      break;
    }
    let weight = getValue(value);
    sum = sum.plus(weight);
    const old = current;
    current = sum.div(amount);
    if (current.lte(start)) {
      // eslint-disable-next-line
      continue;
    }
    if (old.lt(start)) {
      weight = current.gt(end) ? end.minus(start).times(amount) : current.minus(start).times(amount);
    } else if (current.gt(end)) {
      weight = end.minus(old).times(amount);
    }

    mutableResult.push([
      value,
      weight.gte(0) ? weight.integerValue(BigNumber.ROUND_FLOOR) : weight.integerValue(BigNumber.ROUND_CEIL),
    ]);
  }

  return mutableResult;
}

function equals<T>(
  // tslint:disable-next-line no-any readonly-array
  clazz: new (...args: any[]) => T,
  thiz: T,
  equalsFunc: (other: T) => boolean,
  // tslint:disable-next-line no-any
): (other: any) => boolean {
  return (other): boolean => other != undefined && (thiz === other || (other instanceof clazz && equalsFunc(other)));
}

const wildCardFromJSON = <T>(json: WildcardContainerJSON, selector: (input: string) => T) => {
  if (typeof json === 'string') {
    if (json !== '*') {
      throw new InvalidFormatError();
    }

    return '*';
  }
  if (Array.isArray(json)) {
    return json.map(selector);
  }

  throw new InvalidFormatError();
};

const getInteroperable = <T>(item: StorageItem, fromStackItem: (item: StackItem) => T): T => {
  const buffer = item.value;
  const reader = new BinaryReader(buffer);
  const deserializedStackItem = deserializeStackItem(reader, executionLimits.maxStackSize, executionLimits.maxItemSize);

  return fromStackItem(deserializedStackItem);
};

const getSerializableArray = <T>(
  value: Buffer,
  readValue: (reader: BinaryReader) => T,
  max: number | BN = 0x1000000,
): readonly T[] => {
  const reader = new BinaryReader(value);

  return reader.readArray(() => readValue(reader), max);
};

const getSerializableArrayFromStorageItem = <T>(
  item: StorageItem,
  readValue: (reader: BinaryReader) => T,
  max: number | BN = 0x1000000,
): readonly T[] => {
  const value = item.value;

  return getSerializableArray(value, readValue, max);
};

export const utils = {
  ...clientUtils,
  toASCII,
  toUTF8,
  randomUInt64,
  toKeyString,
  equals,
  lazyAsync,
  lazyOrValue,
  weightedAverage,
  weightedFilter,
  wildCardFromJSON,
  getInteroperable,
  getSerializableArray,
  getSerializableArrayFromStorageItem,
};
