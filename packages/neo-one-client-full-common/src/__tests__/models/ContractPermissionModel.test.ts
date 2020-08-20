import { contractPermissionModel } from '../../__data__';

describe('ContractPermissionModel - serializeJSON', () => {
  test('UInt160', () => {
    expect(contractPermissionModel('uint160').serializeJSON()).toMatchSnapshot();
  });

  test('ECPoint', () => {
    expect(contractPermissionModel('ecpoint', ['method1']).serializeJSON()).toMatchSnapshot();
  });

  test('undefined', () => {
    expect(contractPermissionModel(undefined, ['method1', 'method2']).serializeJSON()).toMatchSnapshot();
  });
});
