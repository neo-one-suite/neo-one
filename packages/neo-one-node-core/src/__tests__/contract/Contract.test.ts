import { createContract, testContext as context } from '../../__data__';
import { Contract } from '../../contract';

describe('Contract', () => {
  test('serialize/deserialize', () => {
    const contract = createContract();
    const serialized = contract.serializeWire();
    const deserialized = Contract.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.script).toEqual(contract.script);
    expect(JSON.stringify(deserialized.manifest)).toEqual(JSON.stringify(contract.manifest));
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON();
    // specifics values of ContractManifest checked in its tests
    expect(serializedJson.script).toEqual(contract.script.toString('hex'));
    expect(serializedJson.manifest).toBeDefined();
  });
});
