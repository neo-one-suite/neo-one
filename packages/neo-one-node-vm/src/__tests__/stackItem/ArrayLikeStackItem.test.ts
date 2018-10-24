import { deserializeStackItem } from '../..';
import { factory, testUtils } from '../../__data__/';
import { ArrayStackItem, StructStackItem, UInt256StackItem } from '../../stackItem';

describe('Array(Like) Stack Item', () => {
  const initUInt = factory.createUInt256();
  factory.incrementData();
  const secondUInt = factory.createUInt256();

  const arrayStackItem = new ArrayStackItem([new UInt256StackItem(initUInt), new UInt256StackItem(secondUInt)]);
  const structStackItem = new StructStackItem([new UInt256StackItem(initUInt), new UInt256StackItem(secondUInt)]);
  const nestedStructStackItem = new StructStackItem([structStackItem]);

  test('Array - Deserialize serialized', () => {
    const serialArrayItem = arrayStackItem.serialize();
    const deserializedArrayItem = deserializeStackItem(serialArrayItem);

    expect(deserializedArrayItem.asArray()).toEqual(arrayStackItem.asArray());
  });

  test('Array - asBoolean', () => {
    expect(arrayStackItem.asBoolean()).toBeTruthy();
  });

  test('Array - convertJSON', () => {
    expect(arrayStackItem.convertJSON()).toMatchSnapshot();
  });

  test('Array - toStructuralKey', () => {
    expect(arrayStackItem.toStructuralKey()).toMatchSnapshot();
  });

  test('Array - equals - true', () => {
    expect(arrayStackItem.equals(arrayStackItem)).toBeTruthy();
  });

  test('Array - equals - false', () => {
    expect(arrayStackItem.equals('no')).toBeFalsy();
  });

  test('Array - toContractParameter throws on seen', () => {
    const seen = testUtils.badSeen(arrayStackItem);
    expect(() => arrayStackItem.toContractParameter(seen)).toThrowError('Circular Reference Error');
  });

  test('Struct - Deserialize serialized', () => {
    const serialStructItem = structStackItem.serialize();
    const deserializedStructStackItem = deserializeStackItem(serialStructItem);

    expect(deserializedStructStackItem.equals(structStackItem)).toBeTruthy();
  });

  test('Struct - toStructuralKey', () => {
    expect(structStackItem.toStructuralKey()).toMatchSnapshot();
  });

  test('Struct - clones nested', () => {
    expect(nestedStructStackItem.clone()).toEqual(nestedStructStackItem);
  });

  test('Struct - equals - undefined', () => {
    expect(structStackItem.equals(undefined)).toBeFalsy();
  });

  test('Struct - equals - same', () => {
    expect(structStackItem.equals(structStackItem)).toBeTruthy();
  });

  test('Struct - equals - cloned', () => {
    expect(structStackItem.equals(structStackItem.clone())).toBeTruthy();
  });

  test('Struct - equals - different structItem', () => {
    expect(structStackItem.equals(nestedStructStackItem)).toBeFalsy();
  });
  test('Struct - equals - other item', () => {
    expect(structStackItem.equals(true)).toBeFalsy();
  });
});
