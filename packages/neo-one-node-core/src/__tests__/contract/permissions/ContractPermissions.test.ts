import { common, ECPoint, UInt160 } from '@neo-one/client-common';
import { contractPermissions, jsonContext, testContext as context } from '../../../__data__';
import { ContractPermissions } from '../../../contract';

describe('ContractPermissions', () => {
  test('serialize/deserialize - uint160', () => {
    const methods: readonly string[] = [];
    const permissions = contractPermissions('uint160', methods);
    const serialized = permissions.serializeWire();
    const deserialized = ContractPermissions.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.contract.hashOrGroup).toEqual(permissions.contract.hashOrGroup);
    expect(deserialized.methods).toEqual(methods);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.contract).toEqual(common.uInt160ToString(permissions.contract.hashOrGroup as UInt160));
    expect(serializedJson.methods).toEqual(methods);
  });

  test('serialize/deserialize - ecpoint', () => {
    const methods = ['method1'];
    const permissions = contractPermissions('ecpoint', methods);
    const serialized = permissions.serializeWire();
    const deserialized = ContractPermissions.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.contract.hashOrGroup).toEqual(permissions.contract.hashOrGroup);
    expect(deserialized.methods).toEqual(methods);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.contract).toEqual(common.ecPointToString(permissions.contract.hashOrGroup as ECPoint));
    expect(serializedJson.methods).toEqual(methods);
  });

  test('serialize/deserialize - undefined', () => {
    const methods = ['method1', 'method2'];
    const permissions = contractPermissions(undefined, methods);
    const serialized = permissions.serializeWire();
    const deserialized = ContractPermissions.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.contract.hashOrGroup).toEqual(permissions.contract.hashOrGroup);
    expect(deserialized.methods).toEqual(methods);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON(jsonContext);
    expect(serializedJson.contract).toEqual('*');
    expect(serializedJson.methods).toEqual(methods);
  });
});
