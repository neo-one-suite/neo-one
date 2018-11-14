import BN from 'bn.js';
import { testUtils } from '../../__data__';
import { BufferStackItem, IntegerStackItem, MapStackItem } from '../../stackItem';

describe('Map Stack Item', () => {
  const keyStackItem = new IntegerStackItem(new BN(0));
  const valueStackItem = new BufferStackItem(Buffer.from([0x00]));
  const keyMap = new Map<string, IntegerStackItem>([['0', keyStackItem]]);
  const valueMap = new Map<string, BufferStackItem>([[valueStackItem.toStructuralKey(), valueStackItem]]);
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
  test('get throws error on no items', () => {
    expect(() => mapStackItem.get(new IntegerStackItem(new BN(2)))).toThrowError('Map does not contain key.');
  });
  test('toContractParameter throws on seen', () => {
    const seen = testUtils.badSeen(mapStackItem);
    expect(() => mapStackItem.toContractParameter(seen)).toThrowError('Circular Reference Error');
  });
  test('toContractParameter', () => {
    expect(mapStackItem.toContractParameter()).toMatchSnapshot();
  });

  test('convertJSON', () => {
    expect(mapStackItem.convertJSON()).toMatchSnapshot();
  });
});
