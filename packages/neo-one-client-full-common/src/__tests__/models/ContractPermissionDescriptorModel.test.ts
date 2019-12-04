import { BinaryWriter } from '@neo-one/client-common';
import { contractPermissionDescriptorModel } from '../../__data__';

describe('ContractPermissionDescriptorModel - serializeWireBase', () => {
  let writer: BinaryWriter;
  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('UInt160', () => {
    contractPermissionDescriptorModel('uint160').serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('ECPoint', () => {
    contractPermissionDescriptorModel('ecpoint').serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('undefined', () => {
    contractPermissionDescriptorModel(undefined).serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });
});
