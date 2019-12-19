import { common } from '@neo-one/client-common';
import { createContractGroup, testContext as context } from '../../../__data__';
import { ContractGroup } from '../../../contract';

describe('ContractGroup', () => {
  test('serialize/deserialize', () => {
    const group = createContractGroup();
    const serialized = group.serializeWire();
    const deserialized = ContractGroup.deserializeWire({
      context,
      buffer: serialized,
    });

    expect(deserialized.publicKey).toEqual(group.publicKey);
    expect(deserialized.signature).toEqual(group.signature);
    expect(deserialized.size).toEqual(serialized.byteLength);

    const serializedJson = deserialized.serializeJSON();
    expect(serializedJson.publicKey).toEqual(common.ecPointToString(group.publicKey));
    expect(serializedJson.signature).toEqual(group.signature);
  });
});
