import BN from 'bn.js';
import { common } from '../common';
import { IOHelper as helper } from '../IOHelper';
import { utils } from '../utils';

describe('IOHelper Tests', () => {
  const createLongBuffer = (length: BN) => Buffer.allocUnsafe(length.toNumber());

  test('ECPoint Size', () => {
    const ecPoint = common.asECPoint(Buffer.from([...Array(33)].map((_) => 0x00)));
    expect(helper.sizeOfECPoint(ecPoint)).toEqual(33);
  });

  test('ECPoint Size - Inf', () => {
    const ecPointInf = common.ECPOINT_INFINITY;
    expect(helper.sizeOfECPoint(ecPointInf)).toEqual(1);
  });

  test('VarUIntLE Size - FFFF', () => {
    const size = helper.sizeOfVarBytesLE(createLongBuffer(utils.FFFF));

    expect(size).toEqual(65538);
  });

  test('VarUIntLE Size - FFFF + 1', () => {
    const size = helper.sizeOfVarBytesLE(createLongBuffer(utils.FFFF.add(utils.ONE)));

    expect(size).toEqual(65541);
  });

  test('VarString Size', () => {
    const testString = 'test';
    expect(helper.sizeOfVarString(testString)).toEqual(testString.length + 1);
  });

  test('FixedString Size', () => {
    const testString = 'test';
    expect(helper.sizeOfFixedString(testString.length)).toEqual(testString.length);
  });

  test('array', () => {
    expect(helper.sizeOfArray([1, 2, 3], (value) => helper.sizeOfVarBytesLE(Buffer.from([value])))).toEqual(7);
  });

  test('object', () => {
    const testObject = {
      one: Buffer.from([1]),
    };
    expect(
      helper.sizeOfObject(testObject, (key, value) => helper.sizeOfVarString(key) + helper.sizeOfVarBytesLE(value)),
    ).toEqual(7);
  });
});
