import { common } from '@neo-one/client-common';
import { AddChange, DeleteChange, Storage, StorageFlags, StorageItem } from '@neo-one/node-core';
import LevelUp from 'levelup';
import MemDown from 'memdown';
import { storage as levelUpStorage } from '../';

describe('levelUpStorage', () => {
  let storage: Storage;
  beforeEach(async () => {
    storage = levelUpStorage({ db: LevelUp(MemDown()), context: { messageMagic: 1953787457 } });
  });
  test('deleted items are undefined', async () => {
    const hash = common.bufferToUInt160(Buffer.from('3775292229eccdf904f16fff8e83e7cffdc0f0ce', 'hex'));
    const key = Buffer.from('b500', 'hex');
    const value = Buffer.from('5f8d70', 'hex');

    const firstGet = await storage.storageItem.tryGet({ hash, key });
    expect(firstGet).toEqual(undefined);

    const storageItem = new StorageItem({
      hash,
      key,
      value,
      flags: StorageFlags.None,
    });
    const addChange: AddChange = {
      type: 'storageItem',
      value: storageItem,
    };
    await storage.commit([{ type: 'add', change: addChange, subType: 'add' }]);
    const secondGet = await storage.storageItem.tryGet({ hash, key });
    expect(JSON.stringify(secondGet)).toEqual(JSON.stringify(storageItem));

    const deleteChange: DeleteChange = {
      type: 'storageItem',
      key: { hash, key },
    };
    await storage.commit([{ type: 'delete', change: deleteChange }]);

    const thirdGet = await storage.storageItem.tryGet({ hash, key });
    expect(thirdGet).toEqual(undefined);
  });
});
