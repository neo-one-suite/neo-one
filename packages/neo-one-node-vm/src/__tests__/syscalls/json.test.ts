// tslint:disable no-object-mutation
import { BN } from 'bn.js';
import { runSysCalls, TestCase } from '../../__data__';
import { FEES } from '../../constants';
import {
  ArrayStackItem,
  BooleanStackItem,
  IntegerStackItem,
  MapStackItem,
  NullStackItem,
  StackItem,
  StringStackItem,
} from '../../stackItem';

// Helpers
export const createKeysMap = (stackArray: readonly StackItem[]): Map<string, StackItem> => {
  const map = new Map<string, StackItem>();
  stackArray.forEach((key) => map.set(key.toStructuralKey(), key));

  return map;
};
export const createValuesMap = (
  keysArray: readonly StackItem[],
  valuesArray: readonly StackItem[],
): Map<string, StackItem> => {
  const map = new Map();
  keysArray.forEach((key, i) => map.set(key.toStructuralKey(), valuesArray[i]));

  return map;
};

// Simple JSON
export const simpleJson = { key: 'value' };
export const simpleJsonKey = new StringStackItem('key');
export const simpleJsonValue = new StringStackItem('value');
export const simpleJsonKeys: ReadonlyArray<StackItem> = [simpleJsonKey];
export const simpleJsonValues: ReadonlyArray<StackItem> = [simpleJsonValue];
export const simpleMapStackItem = new MapStackItem({
  referenceKeys: createKeysMap(simpleJsonKeys),
  referenceValues: createValuesMap(simpleJsonKeys, simpleJsonValues),
});
export const simpleJsonToBuffer = Buffer.from(JSON.stringify(simpleJson));

// Nested JSON
export const nestedJson = {
  // tslint:disable-next-line: no-null-keyword
  first: { second: ['string', 10, true], third: null, fourth: 'string', fifth: 10, sixth: false },
};
export const secondKey = new StringStackItem('second');
export const thirdKey = new StringStackItem('third');
export const fourthKey = new StringStackItem('fourth');
export const fifthKey = new StringStackItem('fifth');
export const sixthKey = new StringStackItem('sixth');
export const nestedJsonKeys: ReadonlyArray<StackItem> = [secondKey, thirdKey, fourthKey, fifthKey, sixthKey];
export const secondValue = new ArrayStackItem([
  new StringStackItem('string'),
  new IntegerStackItem(new BN(10)),
  new BooleanStackItem(true),
]);
export const thirdValue = new NullStackItem();
export const fourthValue = new StringStackItem('string');
export const fifthValue = new IntegerStackItem(new BN(10));
export const sixthValue = new BooleanStackItem(false);
export const nestedJsonValues: ReadonlyArray<StackItem> = [
  secondValue,
  thirdValue,
  fourthValue,
  fifthValue,
  sixthValue,
];
export const outerNestedJsonKeys: ReadonlyArray<StackItem> = [new StringStackItem('first')];
export const outerNestedJsonValues: ReadonlyArray<StackItem> = [
  new MapStackItem({
    referenceKeys: createKeysMap(nestedJsonKeys),
    referenceValues: createValuesMap(nestedJsonKeys, nestedJsonValues),
  }),
];
export const nestedMapStackItem = new MapStackItem({
  referenceKeys: createKeysMap(outerNestedJsonKeys),
  referenceValues: createValuesMap(outerNestedJsonKeys, outerNestedJsonValues),
});
export const nestedJsonToBuffer = Buffer.from(JSON.stringify(nestedJson));

const SYSCALLS: readonly TestCase[] = [
  {
    name: 'System.Json.Serialize',
    result: [new StringStackItem(JSON.stringify(simpleJson))],
    args: [simpleJsonToBuffer],
    gas: FEES[100_000],
  },

  {
    name: 'System.Json.Serialize',
    result: [new StringStackItem(JSON.stringify(nestedJson))],
    args: [nestedJsonToBuffer],
    gas: FEES[100_000],
  },

  {
    name: 'System.Json.Serialize',
    result: [new StringStackItem(JSON.stringify(1))],
    args: [1],
    gas: FEES[100_000],
  },

  {
    name: 'System.Json.Deserialize',
    result: [simpleMapStackItem],
    args: [JSON.stringify(simpleJson)],
    gas: FEES[500_000],
  },

  {
    name: 'System.Json.Deserialize',
    result: [nestedMapStackItem],
    args: [JSON.stringify(nestedJson)],
    gas: FEES[500_000],
  },

  {
    name: 'System.Json.Deserialize',
    result: [new IntegerStackItem(new BN(1))],
    args: ['1'],
    gas: FEES[500_000],
  },
];

describe('SysCalls: System.Json', () => {
  runSysCalls(SYSCALLS);
});
