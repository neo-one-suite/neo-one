import { BinaryWriter } from '../../../BinaryWriter';
import { common } from '../../../common';
import {
  assertAttributeUsage,
  assertAttributeUsageJSON,
  BufferAttributeModel,
  ECPointAttributeModel,
  toAttributeUsage,
  toJSONAttributeUsage,
  UInt160AttributeModel,
  UInt256AttributeModel,
} from '../../../models';

describe('Attribute Usage Model', () => {
  const goodByte = 0x00;

  test('toAttributeUsage', () => {
    expect(toAttributeUsage('ContractHash')).toEqual(0);
  });

  test('AssertAttributeUsage', () => {
    expect(assertAttributeUsage(goodByte)).toEqual(goodByte);
  });

  test('toJSONAttributeUsage', () => {
    expect(toJSONAttributeUsage(goodByte)).toEqual('ContractHash');
  });

  test('AssertAttributeUsage - Throw Bad Usage', () => {
    const badByte = 0xbb;
    expect(() => assertAttributeUsage(badByte)).toThrowError(
      `Expected transaction attribute usage, found: ${badByte.toString(16)}`,
    );
  });

  test('AssertAttributeUSageJSON - Throw Bad JSON', () => {
    expect(() => assertAttributeUsageJSON('boop')).toThrowError(
      `Expected transaction attribute usage, found: ${'boop'}`,
    );
  });
});

// tslint:disable-next-line:no-let
let testWriter: BinaryWriter;

const resetWriter = () => {
  testWriter = new BinaryWriter();
};

describe('Buffer Attribute Model', () => {
  beforeEach(resetWriter);

  const value = Buffer.from('test', 'hex');

  test('SerializeWireBase', () => {
    const usage = 0x90;
    const bufferModel = new BufferAttributeModel({ usage, value });
    bufferModel.serializeWireBase(testWriter);
    expect(testWriter.buffer[0]).toEqual(Buffer.from([0x90]));
  });

  test('SerializeWireBase - URL Model', () => {
    const descriptionUrl = 0x81;

    const urlModel = new BufferAttributeModel({ usage: descriptionUrl, value });

    urlModel.serializeWireBase(testWriter);
    expect(testWriter.buffer[0]).toEqual(Buffer.from([0x81]));
  });
});

test('ECPoint Attribute Model', () => {
  resetWriter();
  const usage = 0x02;
  const ecPoint = common.asECPoint(Buffer.from([...Array(33)].map(() => 0x01)));

  const ecModel = new ECPointAttributeModel({ usage, value: ecPoint });
  ecModel.serializeWireBase(testWriter);

  expect(testWriter.buffer[0]).toEqual(Buffer.from([usage]));
  expect(testWriter.buffer[1].length).toEqual(32);
});

test('UInt160 Attribute Model', () => {
  resetWriter();
  const usage = 0x20;
  const uInt = common.asUInt160(Buffer.alloc(20, 0));

  const uInt160Model = new UInt160AttributeModel({ usage, value: uInt });
  uInt160Model.serializeWireBase(testWriter);

  expect(testWriter.buffer[0]).toEqual(Buffer.from([usage]));
});

test('UInt256 Attribute Model', () => {
  resetWriter();
  const usage = 0xa6;
  const uInt = common.asUInt256(Buffer.alloc(32, 0));

  const uInt256Model = new UInt256AttributeModel({ usage, value: uInt });
  uInt256Model.serializeWireBase(testWriter);

  expect(testWriter.buffer[0]).toEqual(Buffer.from([usage]));
});
