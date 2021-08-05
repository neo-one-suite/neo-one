import { common } from '@neo-one/client-common';
import { AddChange, DeleteChange, Storage, StorageItem, StorageKey } from '@neo-one/node-core';
import LevelUp from 'levelup';
import RocksDB from 'rocksdb';
import { storage as levelUpStorage } from '../';

describe('rocksDBStorage', () => {
  let storage: Storage;
  beforeEach(async () => {
    const rocks = new RocksDB('/Users/spencercorwin/Desktop/test-location');
    storage = levelUpStorage({
      db: LevelUp(rocks),
      context: { network: 1953787457, validatorsCount: 7, maxValidUntilBlockIncrement: 86400000 / 1500 },
    });
  });
  test('deleted items are undefined', async () => {
    const hash = common.bufferToUInt160(Buffer.from('3775292229eccdf904f16fff8e83e7cffdc0f0ce', 'hex'));
    const key = new StorageKey({ id: 20, key: hash });
    const value = Buffer.from('5f8d70', 'hex');

    const firstGet = await storage.storages.tryGet(key);
    expect(firstGet).toEqual(undefined);

    const storageItem = new StorageItem({
      value,
    });
    const addChange: AddChange = {
      type: 'storage',
      key,
      value: storageItem,
    };

    await storage.commit([{ type: 'add', change: addChange, subType: 'add' }]);
    const secondGet = await storage.storages.tryGet(key);
    expect(JSON.stringify(secondGet)).toEqual(JSON.stringify(storageItem));

    const deleteChange: DeleteChange = {
      type: 'storage',
      key,
    };

    await storage.commit([{ type: 'delete', change: deleteChange }]);

    const thirdGet = await storage.storages.tryGet(key);
    expect(thirdGet).toEqual(undefined);
  });
});
