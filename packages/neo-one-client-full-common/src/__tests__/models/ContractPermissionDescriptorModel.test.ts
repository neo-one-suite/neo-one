import { contractPermissionDescriptorModel } from '../../__data__';

describe('ContractPermissionDescriptorModel - serializeJSON', () => {
  test('UInt160', () => {
    const permission = contractPermissionDescriptorModel('uint160');
    expect(permission.isHash).toBeTruthy();
    expect(permission.isGroup).toBeFalsy();
    expect(permission.isWildcard()).toBeFalsy();
    expect(permission.serializeJSON()).toMatchSnapshot();
  });

  test('ECPoint', () => {
    const permission = contractPermissionDescriptorModel('ecpoint');
    expect(permission.isGroup).toBeTruthy();
    expect(permission.isHash).toBeFalsy();
    expect(permission.isWildcard()).toBeFalsy();
    expect(permission.serializeJSON()).toMatchSnapshot();
  });

  test('undefined', () => {
    const permission = contractPermissionDescriptorModel(undefined);
    expect(permission.isWildcard()).toBeTruthy();
    expect(permission.isHash).toBeFalsy();
    expect(permission.isGroup).toBeFalsy();
    expect(permission.serializeJSON()).toMatchSnapshot();
  });
});
