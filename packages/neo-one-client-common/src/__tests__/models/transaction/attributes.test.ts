import { BinaryWriter } from '../../../BinaryWriter';
import {
  assertAttributeType,
  assertAttributeTypeJSON,
  HighPriorityAttributeModel,
  toAttributeType,
  toJSONAttributeType,
} from '../../../models';

describe('Attribute Type Model', () => {
  const goodByte = 1;

  test('toAttributeType', () => {
    expect(toAttributeType('HighPriority')).toEqual(1);
  });

  test('AssertAttributeType', () => {
    expect(assertAttributeType(goodByte)).toEqual(goodByte);
  });

  test('toJSONAttributeType', () => {
    expect(toJSONAttributeType(goodByte)).toEqual('HighPriority');
  });

  test('AssertAttributeType - Throw Bad Type', () => {
    const badByte = 0xbb;
    expect(() => assertAttributeType(badByte)).toThrowError(
      `Expected transaction type, found: ${badByte.toString(16)}`,
    );
  });

  test('AssertAttributeTypeJSON - Throw Bad JSON', () => {
    expect(() => assertAttributeTypeJSON('boop')).toThrowError(`Invalid AttributeType: ${'boop'}`);
  });
});

// tslint:disable-next-line:no-let
let testWriter: BinaryWriter;

const resetWriter = () => {
  testWriter = new BinaryWriter();
};

describe('HighPrioity Attribute Type Model', () => {
  beforeEach(resetWriter);

  test('SerializeWireBase', () => {
    const highPriorityModel = new HighPriorityAttributeModel();
    highPriorityModel.serializeWireBase(testWriter);
    expect(testWriter.toBuffer()[0]).toEqual(0x01);
  });
});
