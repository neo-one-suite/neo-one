import { common, ECPoint, UInt160 } from '@neo-one/client-common';
import { contractPermissionDescriptor, jsonContext, testContext as context } from '../../../__data__';
import { ContractPermissionDescriptor } from '../../../contract';

describe('ContractPermissionDescriptor', () => {
  test('serialize/deserialize - uint160', () => {
    const permission = contractPermissionDescriptor('uint160');
    const serialized = permission.serializeWire();
    const deserialized = ContractPermissionDescriptor.deserializeWire({
      context,
      buffer: serialized,
    });
    expect(deserialized.hashOrGroup).toEqual(permission.hashOrGroup);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson).toEqual(common.uInt160ToString(permission.hashOrGroup as UInt160));
  });

  test('serialize/deserialize - ecpoint', () => {
    const permission = contractPermissionDescriptor('ecpoint');
    const serialized = permission.serializeWire();
    const deserialized = ContractPermissionDescriptor.deserializeWire({
      context,
      buffer: serialized,
    });
    expect(deserialized.hashOrGroup).toEqual(permission.hashOrGroup);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson).toEqual(common.ecPointToString(permission.hashOrGroup as ECPoint));
  });

  test('serialize/deserialize - undefined', () => {
    const permission = contractPermissionDescriptor(undefined);
    const serialized = permission.serializeWire();
    const deserialized = ContractPermissionDescriptor.deserializeWire({
      context,
      buffer: serialized,
    });
    expect(deserialized.hashOrGroup).toEqual(permission.hashOrGroup);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson).toEqual('*');
  });
});
