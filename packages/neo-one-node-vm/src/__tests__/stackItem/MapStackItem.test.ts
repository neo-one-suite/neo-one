import { BN } from 'bn.js';
import { testUtils } from '../../__data__';
import { BufferStackItem, IntegerStackItem, MapStackItem } from '../../stackItem';
import {
  nestedMapStackItem,
  outerNestedJsonKeys,
  outerNestedJsonValues,
  simpleJsonKey,
  simpleJsonKeys,
  simpleJsonValue,
  simpleJsonValues,
  simpleMapStackItem,
} from '../syscalls.test';

describe('Map Stack Item', () => {
  const keyStackItem = new IntegerStackItem(new BN(0));
  const valueStackItem = new BufferStackItem(Buffer.from([0x00]));
  const keyMap = new Map<string, IntegerStackItem>([['0', keyStackItem] as const]);
  const valueMap = new Map<string, BufferStackItem>([[valueStackItem.toStructuralKey(), valueStackItem] as const]);
  const mapStackItem = new MapStackItem({
    referenceKeys: keyMap,
    referenceValues: valueMap,
  });

  test('toStructuralKey', () => {
    expect(mapStackItem.toStructuralKey()).toMatchSnapshot();
  });
  test('equals - different value (false)', () => {
    expect(mapStackItem.equals(true)).toBeFalsy();
  });
  test('isMap - (returns false)', () => {
    expect(mapStackItem.isMap()).toBeFalsy();
  });
  test('asBoolean - true', () => {
    expect(mapStackItem.asBoolean()).toBeTruthy();
  });
  test('asBuffer throws', () => {
    expect(() => mapStackItem.asBuffer()).toThrowError('Invalid Value. Expected Buffer');
  });
  test('get', () => {
    expect(mapStackItem.get(keyStackItem)).toEqual(valueStackItem);
    mapStackItem.keysArray().forEach((key) => {
      expect(mapStackItem.get(key)).toBeDefined();
    });
    simpleMapStackItem.keysArray().forEach((key) => {
      expect(simpleMapStackItem.get(key)).toBeDefined();
    });
    nestedMapStackItem.keysArray().forEach((key) => {
      expect(nestedMapStackItem.get(key)).toBeDefined();
    });
    expect(() => mapStackItem.get(new IntegerStackItem(new BN(2)))).toThrowError('Map does not contain key.');
  });
  test('toContractParameter throws on seen', () => {
    const seen = testUtils.badSeen(mapStackItem);
    expect(() => mapStackItem.toContractParameter(seen)).toThrowError('Circular Reference Error');
  });
  test('toContractParameter', () => {
    expect(mapStackItem.toContractParameter()).toMatchSnapshot();
  });
  test('keysArray returns keys', () => {
    expect(mapStackItem.keysArray()).toEqual([keyStackItem]);
    expect(simpleMapStackItem.keysArray()).toEqual(simpleJsonKeys);
    expect(nestedMapStackItem.keysArray()).toEqual(outerNestedJsonKeys);
  });
  test('valuesArray returns keys', () => {
    expect(mapStackItem.valuesArray()).toEqual([valueStackItem]);
    expect(simpleMapStackItem.valuesArray()).toEqual(simpleJsonValues);
    expect(nestedMapStackItem.valuesArray()).toEqual(outerNestedJsonValues);
  });
  test('entriesArray returns entries', () => {
    expect(mapStackItem.entriesArray()).toEqual([[keyStackItem, valueStackItem]]);
    expect(simpleMapStackItem.entriesArray()).toEqual([[simpleJsonKey, simpleJsonValue]]);
  });
  test('convertJSON', () => {
    expect(mapStackItem.convertJSON()).toMatchSnapshot();
  });
});
