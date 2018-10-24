import { common } from '@neo-one/client-common';
import { factory, testUtils } from '../../__data__';
import { BufferStackItem, HeaderStackItem, InputStackItem, UInt160StackItem, UInt256StackItem } from '../../stackItem';

describe('Stack Item Base', () => {
  const uInt160 = factory.createUInt160();
  const uInt256 = factory.createUInt256();
  const header = factory.createHeader();
  const input = factory.createInput();
  const buff = Buffer.from([]);
  const uInt160StackItem = new UInt160StackItem(uInt160);
  const uInt256StackItem = new UInt256StackItem(uInt256);
  const headerStackItem = new HeaderStackItem(header);
  const inputStackItem = new InputStackItem(input);
  const bufferStackItem = new BufferStackItem(buff);

  test('equals - undefined', () => {
    expect(uInt160StackItem.equals(undefined)).toBeFalsy();
  });

  test('equals - true (same)', () => {
    expect(uInt160StackItem.equals(uInt160StackItem)).toBeTruthy();
  });

  test('equals - false (different stackItem)', () => {
    expect(uInt160StackItem.equals(uInt256StackItem)).toBeFalsy();
  });

  test('equals - false (number)', () => {
    expect(uInt160StackItem.equals(1)).toBeFalsy();
  });

  test('serialize - throws on seen', () => {
    const seen = testUtils.badSeen(uInt160StackItem);
    expect(() => uInt160StackItem.serialize(seen)).toThrowError('Attempted to serialize a recursive structure.');
  });

  test('asArray - throws', () => {
    expect(() => uInt160StackItem.asArray()).toThrowError('Invalid Value. Expected Array');
  });

  test('asUInt160Maybe - uInt160', () => {
    expect(uInt160StackItem.asUInt160Maybe()).toEqual(uInt160);
  });

  test('asUInt160Maybe - uInt256 (bad)', () => {
    expect(uInt256StackItem.asUInt160Maybe()).toEqual(undefined);
  });

  test('asUInt256Maybe - uInt256', () => {
    expect(uInt256StackItem.asUInt256Maybe()).toEqual(uInt256);
  });

  test('asUInt256Maybe - uInt160 (bad)', () => {
    expect(uInt160StackItem.asUInt256Maybe()).toEqual(undefined);
  });

  test('asECPoint - infinity', () => {
    expect(bufferStackItem.asECPoint()).toEqual(common.ECPOINT_INFINITY);
  });

  test('asECPointMaybe - Good', () => {
    expect(bufferStackItem.asECPointMaybe()).toEqual(common.ECPOINT_INFINITY);
  });

  test('asECPointMaybe - bad', () => {
    expect(headerStackItem.asECPointMaybe()).toEqual(undefined);
  });

  test('Errors - asHeader', () => {
    expect(() => uInt160StackItem.asHeader()).toThrowError('Invalid Value. Expected Header');
  });
  test('Errors - asBlockBase', () => {
    expect(() => uInt160StackItem.asBlockBase()).toThrowError('Invalid Value. Expected BlockBase');
  });
  test('Errors - asBlock', () => {
    expect(() => uInt160StackItem.asBlock()).toThrowError('Invalid Value. Expected Block');
  });
  test('Errors - asTransaction', () => {
    expect(() => uInt160StackItem.asTransaction()).toThrowError('Invalid Value. Expected Transaction');
  });
  test('Errors - asAttribute', () => {
    expect(() => uInt160StackItem.asAttribute()).toThrowError('Invalid Value. Expected Attribute');
  });
  test('Errors - asAttributeStackItem', () => {
    expect(() => uInt160StackItem.asAttributeStackItem()).toThrowError('Invalid Value. Expected AttributeStackItem');
  });
  test('Errors - asInput', () => {
    expect(() => uInt160StackItem.asInput()).toThrowError('Invalid Value. Expected Input');
  });
  test('Errors - asOutput', () => {
    expect(() => uInt160StackItem.asOutput()).toThrowError('Invalid Value. Expected Output');
  });
  test('Errors - asAccount', () => {
    expect(() => uInt160StackItem.asAccount()).toThrowError('Invalid Value. Expected Account');
  });
  test('Errors - asAsset', () => {
    expect(() => uInt160StackItem.asAsset()).toThrowError('Invalid Value. Expected Asset');
  });
  test('Errors - asContract', () => {
    expect(() => uInt160StackItem.asContract()).toThrowError('Invalid Value. Expected Contract');
  });
  test('Errors - asValidator', () => {
    expect(() => uInt160StackItem.asValidator()).toThrowError('Invalid Value. Expected Validator');
  });
  test('Errors - asMapStackItem', () => {
    expect(() => uInt160StackItem.asMapStackItem()).toThrowError('Invalid Value. Expected MapStackItem');
  });
  test('Errors - asEnumerator', () => {
    expect(() => uInt160StackItem.asEnumerator()).toThrowError('Invalid Value. Expected Enumerator');
  });
  test('Errors - asIterator', () => {
    expect(() => uInt160StackItem.asIterator()).toThrowError('Invalid Value. Expected Iterator');
  });
  test('Base - isMap', () => {
    expect(uInt160StackItem.isMap()).toBeFalsy();
  });
  test('Base - circular return', () => {
    const seen = testUtils.badSeen(uInt160StackItem);
    expect(uInt160StackItem.convertJSON(seen)).toEqual('<circular>');
  });
  test('convertJSON - "UNKNOWN"', () => {
    expect(inputStackItem.convertJSON()).toEqual('UNKNOWN');
  });
});
