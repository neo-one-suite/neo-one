import _ from 'lodash';
import { BinaryWriter } from '../BinaryWriter';
import { common } from '../common';
import { utils } from '../utils';

describe('Binary Writer Tests', () => {
  let writer: BinaryWriter;

  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('Write Int16LE', () => {
    const sixteenLE = writer.writeInt16LE(16);

    expect(sixteenLE.buffer).toEqual([Buffer.concat([Buffer.from([0x10]), Buffer.from([0x00])])]);
  });

  test('Write UInt16BE', () => {
    const sixteenBE = writer.writeUInt16BE(16);

    expect(sixteenBE.buffer).toEqual([Buffer.concat([Buffer.from([0x00]), Buffer.from([0x10])])]);
  });

  test('Write Int32LE', () => {
    const thirtyTwoLE = writer.writeInt32LE(32);

    expect(thirtyTwoLE.buffer).toEqual([
      Buffer.concat([Buffer.from([0x20]), Buffer.from([0x00]), Buffer.from([0x00]), Buffer.from([0x00])]),
    ]);
  });

  test('Write VarString', () => {
    const testString = '1';
    const varString = writer.writeVarString(testString, 2);

    expect(varString.buffer).toEqual([Buffer.from([testString.length]), Buffer.from([0x31])]);
  });

  test('Write ECPoint', () => {
    const ecPoint = common.asECPoint(Buffer.from(_.range(33).map(() => 0x00)));
    const ecBuffer = writer.writeECPoint(ecPoint);

    expect(ecBuffer.buffer).toEqual([ecPoint]);
  });

  test('Write ECPoint - Inf', () => {
    const ecPointInf = common.ECPOINT_INFINITY;
    const ecInf = writer.writeECPoint(ecPointInf);

    expect(ecInf.buffer).toEqual([ecPointInf]);
  });

  test('Write Boolean - False', () => {
    const falsy = writer.writeBoolean(false);

    expect(falsy.buffer).toEqual([Buffer.from([0x00])]);
  });

  test('Write Boolean - True', () => {
    const truthy = writer.writeBoolean(true);

    expect(truthy.buffer).toEqual([Buffer.from([0x01])]);
  });

  test('Write FixedString', () => {
    const fixedString = writer.writeFixedString('test', 6);

    expect(fixedString.buffer).toMatchSnapshot();
  });

  test('Write Object', () => {
    const testObject = {
      one: 1,
    };

    const writtenObject = writer.writeObject(testObject, (key, value) => {
      writer.writeVarString(key);
      writer.writeInt16LE(value);
    });

    expect(writtenObject.buffer).toMatchSnapshot();
  });

  test('VarUInt ranges - FFFF', () => {
    const varUInt = writer.writeVarUIntLE(utils.FFFF);

    expect(varUInt.buffer[0]).toEqual(Buffer.from([0xfd]));
  });

  test('VarUInt ranges - FFFF + 1', () => {
    const varUInt = writer.writeVarUIntLE(utils.FFFF.add(utils.ONE));

    expect(varUInt.buffer[0]).toEqual(Buffer.from([0xfe]));
  });

  test('VarUInt ranges - FFFFFFFF', () => {
    const varUInt = writer.writeVarUIntLE(utils.FFFFFFFF);

    expect(varUInt.buffer[0]).toEqual(Buffer.from([0xfe]));
  });

  test('VarUInt ranges - FFFFFFFF + 1', () => {
    const varUInt = writer.writeVarUIntLE(utils.FFFFFFFF.add(utils.ONE));

    expect(varUInt.buffer[0]).toEqual(Buffer.from([0xff]));
  });

  test('Errors - UInt Throws On LT 0', () => {
    const UIntThrow = () => writer.writeVarUIntLE(-1);

    expect(UIntThrow).toThrowError('Expected value to be zero or positive');
  });

  test('Errors - FixedString Throws On (Message Length > Input Length)', () => {
    const fixedStringThrows = () => writer.writeFixedString('asdfasdf', 2);

    expect(fixedStringThrows).toThrowError('String too long');
  });

  test('Errors - FixedString Throws On (Message Buffer Length > Input Length)', () => {
    const fixedStringThrows = () => writer.writeFixedString('ʦʦʦʦ', 4);

    expect(fixedStringThrows).toThrowError('String buffer length too long');
  });
});
