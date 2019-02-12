import { common } from '@neo-one/client-common';
import { deserializeStorageChangeWire, StorageChangeDelete, StorageChangeType } from '../../storageChange';

describe('StorageChangeDelete', () => {
  const storageChange = new StorageChangeDelete({
    hash: common.bufferToUInt160(Buffer.from('3775292229eccdf904f16fff8e83e7cffdc0f0ce', 'hex')),
    key: Buffer.from('b500', 'hex'),
  });

  test('serialize/deserialize', () => {
    const serialized = storageChange.serializeWire();
    const deserialized = deserializeStorageChangeWire({ context: { messageMagic: 0 }, buffer: serialized });

    if (deserialized.type !== StorageChangeType.Delete) {
      expect(deserialized.type).toEqual(StorageChangeType.Delete);
      throw new Error('For TS');
    }
    expect(deserialized.hash).toEqual(storageChange.hash);
    expect(deserialized.key).toEqual(storageChange.key);
  });
});
