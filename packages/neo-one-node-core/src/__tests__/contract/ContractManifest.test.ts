import { common } from '@neo-one/client-common';
import { contractManifest, testContext as context } from '../../__data__';
import { ContractManifest } from '../../contract';

describe('ContractManifest', () => {
  test('serialize/deserialize', () => {
    const manifest = contractManifest();
    const serialized = manifest.serializeWire();
    const deserialized = ContractManifest.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(JSON.stringify(deserialized.abi)).toEqual(JSON.stringify(manifest.abi));
    expect(deserialized.groups.length).toEqual(1);
    expect(JSON.stringify(deserialized.groups)).toEqual(JSON.stringify(manifest.groups));
    expect(deserialized.permissions.length).toEqual(1);
    expect(JSON.stringify(deserialized.permissions)).toEqual(JSON.stringify(manifest.permissions));
    expect(deserialized.trusts.length).toEqual(1);
    expect(deserialized.trusts).toEqual(manifest.trusts);
    expect(deserialized.safeMethods.length).toEqual(2);
    expect(deserialized.safeMethods).toEqual(manifest.safeMethods);
    expect(deserialized.features).toEqual(manifest.features);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON();
    // specifics values of ContractABI, ContractGroup, and ContractPermissions checked in respective tests
    expect(serializedJson.abi).toBeDefined();
    expect(serializedJson.groups.length).toEqual(1);
    expect(serializedJson.permissions.length).toEqual(1);
    expect(serializedJson.trusts).toEqual(manifest.trusts.map(common.uInt160ToString));
    expect(serializedJson.safeMethods).toEqual(manifest.safeMethods);
    expect(serializedJson.features).toEqual({ storage: true, payable: true });
  });
});
