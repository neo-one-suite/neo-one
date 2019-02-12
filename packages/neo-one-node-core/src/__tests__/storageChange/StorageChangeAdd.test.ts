import { common } from '@neo-one/client-common';
import { deserializeStorageChangeWire, StorageChangeAdd, StorageChangeType } from '../../storageChange';

describe('StorageChangeAdd', () => {
  const storageChange = new StorageChangeAdd({
    hash: common.bufferToUInt160(Buffer.from('3775292229eccdf904f16fff8e83e7cffdc0f0ce', 'hex')),
    key: Buffer.from('b500', 'hex'),
    value: Buffer.from('5f8d70', 'hex'),
  });

  test('serialize/deserialize', () => {
    const serialized = storageChange.serializeWire();
    const deserialized = deserializeStorageChangeWire({ context: { messageMagic: 0 }, buffer: serialized });

    if (deserialized.type !== StorageChangeType.Add) {
      expect(deserialized.type).toEqual(StorageChangeType.Add);
      throw new Error('For TS');
    }
    expect(deserialized.hash).toEqual(storageChange.hash);
    expect(deserialized.key).toEqual(storageChange.key);
    expect(deserialized.value).toEqual(storageChange.value);
  });
});
