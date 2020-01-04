import { BinaryWriter } from '@neo-one/client-common';
import { contractPermissionDescriptorModel } from '../../__data__';

describe('ContractPermissionDescriptorModel - serializeWireBase', () => {
  let writer: BinaryWriter;
  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('UInt160', () => {
    const permission = contractPermissionDescriptorModel('uint160');
    expect(permission.isHash()).toBeTruthy();
    expect(permission.isGroup()).toBeFalsy();
    expect(permission.isWildcard()).toBeFalsy();
    permission.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('ECPoint', () => {
    const permission = contractPermissionDescriptorModel('ecpoint');
    expect(permission.isGroup()).toBeTruthy();
    expect(permission.isHash()).toBeFalsy();
    expect(permission.isWildcard()).toBeFalsy();
    permission.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('undefined', () => {
    const permission = contractPermissionDescriptorModel(undefined);
    expect(permission.isWildcard()).toBeTruthy();
    expect(permission.isHash()).toBeFalsy();
    expect(permission.isGroup()).toBeFalsy();
    permission.serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });
});
