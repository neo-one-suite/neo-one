import { BinaryWriter } from '@neo-one/client-common';
import { contractParamModel } from '../../../__data__';

describe('ContractParameterModel - serializeWireBase', () => {
  let writer: BinaryWriter;
  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('Boolean', () => {
    contractParamModel.boolean.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('ByteArray', () => {
    contractParamModel.byteArray.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Hash160', () => {
    contractParamModel.hash160.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Hash256', () => {
    contractParamModel.hash256.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Array', () => {
    contractParamModel.array.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Integer', () => {
    contractParamModel.integer.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('InteropInterface', () => {
    contractParamModel.interopInterface.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Map', () => {
    contractParamModel.map.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('PublicKey', () => {
    contractParamModel.publicKey.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Signature', () => {
    contractParamModel.signature.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('String', () => {
    contractParamModel.string.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('Void', () => {
    contractParamModel.void.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });
});
