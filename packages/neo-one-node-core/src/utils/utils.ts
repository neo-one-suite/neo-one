import { InvalidFormatError, utils as clientUtils, WildcardContainerJSON } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { BN } from 'bn.js';
import { randomBytes } from 'crypto';
import _ from 'lodash';
import {
  ArrayStackItem,
  assertPrimitiveStackItem,
  assertStackItem,
  assertStackItemType,
  BooleanStackItem,
  BufferStackItem,
  ByteStringStackItem,
  IntegerStackItem,
  MapStackItem,
  NullStackItem,
  PrimitiveStackItem,
  StackItem,
  StackItemType,
  StructStackItem,
} from '../StackItems';
import { StorageItem } from '../StorageItem';
import { BinaryReader } from './BinaryReader';

const toASCII = (bytes: Buffer) => {
  let result = '';
  _.range(bytes.length).forEach((i) => {
    result += String.fromCharCode(bytes.readUInt8(i));
  });

  return result;
};

const toUTF8 = (bytes: Buffer) => bytes.toString('utf8');

const calculateClaimAmount = async ({
  coins,
  decrementInterval,
  generationAmount,
  getSystemFee,
}: {
  readonly coins: ReadonlyArray<{
    readonly value: BN;
    readonly startHeight: number;
    readonly endHeight: number;
  }>;
  readonly decrementInterval: number;
  readonly generationAmount: readonly number[];
  readonly getSystemFee: (index: number) => Promise<BN>;
}): Promise<BN> => {
  const grouped = Object.values(_.groupBy(coins, (coin) => `${coin.startHeight}:${coin.endHeight}`));

  const claimed = await Promise.all(
    grouped.map(async (coinsGroup) => {
      const { startHeight, endHeight } = coinsGroup[0];

      let amount = clientUtils.ZERO;
      let ustart = Math.floor(startHeight / decrementInterval);
      if (ustart < generationAmount.length) {
        let istart = startHeight % decrementInterval;
        let uend = Math.floor(endHeight / decrementInterval);
        let iend = endHeight % decrementInterval;
        if (uend >= generationAmount.length) {
          uend = generationAmount.length;
          iend = 0;
        }

        if (iend === 0) {
          uend -= 1;
          iend = decrementInterval;
        }

        // tslint:disable-next-line no-loop-statement
        while (ustart < uend) {
          amount = amount.addn((decrementInterval - istart) * generationAmount[ustart]);

          ustart += 1;
          istart = 0;
        }

        amount = amount.addn((iend - istart) * generationAmount[ustart]);
      }

      const [sysFeeEnd, sysFeeStart] = await Promise.all([
        getSystemFee(endHeight - 1),
        startHeight === 0 ? Promise.resolve(clientUtils.ZERO) : getSystemFee(startHeight - 1),
      ]);

      amount = amount.add(sysFeeEnd.sub(sysFeeStart).div(clientUtils.ONE_HUNDRED_MILLION));
      const totalValue = coinsGroup.reduce((acc, { value }) => acc.add(value), clientUtils.ZERO);

      return [totalValue, amount];
    }),
  );

  return claimed.reduce(
    (acc, [value, amount]) => acc.add(value.div(clientUtils.ONE_HUNDRED_MILLION).mul(amount)),
    clientUtils.ZERO,
  );
};

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

interface ContainerPlaceholderAdd {
  readonly type: StackItemType;
  readonly elementCount: number;
}

class ContainerPlaceholder {
  public readonly type: StackItemType;
  public readonly elementCount: number;
  public readonly isContainerPlaceHolder = true;

  public constructor({ type, elementCount }: ContainerPlaceholderAdd) {
    this.type = type;
    this.elementCount = elementCount;
  }
}

// tslint:disable-next-line: no-any
const isContainerPlaceholder = (item: any): item is ContainerPlaceholder => item.isContainerPlaceHolder === true;

const getInteroperable = <T>(item: StorageItem, fromStackItem: (item: StackItem) => T): T => {
  const buffer = item.value;
  const reader = new BinaryReader(buffer);
  const deserializedStackItem = deserialize(reader, 16, 34);

  return fromStackItem(deserializedStackItem);
};

// tslint:disable: no-array-mutation no-loop-statement increment-decrement
const deserialize = (reader: BinaryReader, maxArraySize: number, maxItemSize: number): StackItem => {
  const deserialized: Array<StackItem | ContainerPlaceholder> = [];
  let undeserialized = 1;
  while (undeserialized-- > 0) {
    const type = assertStackItemType(reader.readInt8());
    switch (type) {
      case StackItemType.Any:
        deserialized.unshift(new NullStackItem());
        break;

      case StackItemType.Boolean:
        deserialized.unshift(new BooleanStackItem(reader.readBoolean()));
        break;

      case StackItemType.Integer:
        deserialized.unshift(new IntegerStackItem(new BN(reader.readVarBytesLE(IntegerStackItem.maxSize))));
        break;

      case StackItemType.ByteString:
        deserialized.unshift(new ByteStringStackItem(reader.readVarBytesLE(maxItemSize)));
        break;

      case StackItemType.Buffer:
        const size = reader.readVarUIntLE(maxItemSize).toNumber();
        deserialized.unshift(new BufferStackItem(reader.readVarBytesLE(size)));
        break;

      case StackItemType.Array:
      case StackItemType.Struct:
        const structCount = reader.readVarUIntLE(maxArraySize).toNumber();
        deserialized.unshift(new ContainerPlaceholder({ type, elementCount: structCount }));
        undeserialized += structCount;
        break;

      case StackItemType.Map:
        const mapCount = reader.readVarUIntLE(maxArraySize).toNumber();
        deserialized.unshift(new ContainerPlaceholder({ type, elementCount: mapCount }));
        undeserialized += mapCount * 2;
        break;

      default:
        throw new InvalidFormatError(`Invalid StackItemType, found: ${type}`);
    }
  }

  let stackTemp: Array<StackItem | ContainerPlaceholder> = [];
  while (deserialized.length > 0) {
    const item = deserialized.shift();
    if (item === undefined) {
      throw new Error('Unexpected undefined since deserialized.length > 0');
    }
    // tslint:disable-next-line: no-any
    if (isContainerPlaceholder(item)) {
      switch (item.type) {
        case StackItemType.Array:
          const arrayElements = stackTemp.slice(0, item.elementCount).map(assertStackItem);
          stackTemp = stackTemp.slice(item.elementCount);
          stackTemp.unshift(new ArrayStackItem(arrayElements));
          break;

        case StackItemType.Struct:
          const structElements = stackTemp.slice(0, item.elementCount).map(assertStackItem);
          stackTemp = stackTemp.slice(item.elementCount);
          stackTemp.unshift(new StructStackItem(structElements));
          break;

        case StackItemType.Map:
          const mapElements = stackTemp.slice(0, item.elementCount * 2).map(assertStackItem);
          stackTemp = stackTemp.slice(item.elementCount * 2);
          stackTemp.unshift(
            new MapStackItem(
              _.range(0, item.elementCount * 2, 2).reduce((acc, idx) => {
                const key = assertPrimitiveStackItem(mapElements[idx]);
                acc.set(key, mapElements[idx + 1]);

                return acc;
              }, new Map<PrimitiveStackItem, StackItem>()),
            ),
          );
          break;

        default:
          throw new InvalidFormatError(`Invalid ContainerPlaceholder type, found: ${item.type}`);
      }
    } else {
      stackTemp.unshift(item);
    }
  }

  return assertStackItem(stackTemp[0]);
};
// tslint:enable: no-array-mutation no-loop-statement increment-decrement

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
  calculateClaimAmount,
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
