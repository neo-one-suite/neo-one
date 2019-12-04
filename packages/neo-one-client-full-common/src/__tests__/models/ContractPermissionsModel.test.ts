import { BinaryWriter } from '@neo-one/client-common';
import { contractPermissionsModel } from '../../__data__';

describe('ContractPermissionsModel - serializeWireBase', () => {
  let writer: BinaryWriter;
  beforeEach(() => {
    writer = new BinaryWriter();
  });

  test('UInt160', () => {
    contractPermissionsModel('uint160').serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('ECPoint', () => {
    contractPermissionsModel('ecpoint', ['method1']).serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });

  test('undefined', () => {
    contractPermissionsModel(undefined, ['method1', 'method2']).serializeWireBase(writer);
    expect(writer.toBuffer()).toMatchSnapshot();
  });
});
