import { common } from '@neo-one/client-common';
import { StorageFlags, StorageItem, StorageItemKey, StorageItemsKey, StorageItemUpdate } from '@neo-one/node-core';
import { ReadGetAllAddUpdateDeleteStorageCache } from '../StorageCache';

describe('StorageCache', () => {
  const hash = common.asUInt160(Buffer.from('197ff6783d512a740d42f4cc4f5572955fa44c95', 'hex'));
  const key = common.asUInt160(Buffer.from('f3812db982f3b0089a21a278988efeec6a027b25', 'hex'));

  const storageCache = new ReadGetAllAddUpdateDeleteStorageCache<
    StorageItemKey,
    StorageItemsKey,
    StorageItem,
    StorageItemUpdate
  >({
    name: 'storageItem',
    readGetAllStorage: jest.fn(() => ({
      get: jest.fn(),
      tryGet: jest.fn(),
      getAll$: jest.fn(),
    })),
    update: (value, update) => value.update(update),
    getKeyFromValue: (value) => ({
      hash: value.hash,
      key: value.key,
    }),
    getKeyString: (storageKey) => `${common.uInt160ToString(storageKey.hash)}:${storageKey.key.toString('hex')}`,
    matchesPartialKey: (value, storageKey) =>
      (storageKey.hash === undefined || common.uInt160Equal(value.hash, storageKey.hash)) &&
      (storageKey.prefix === undefined || storageKey.prefix.every((byte, idx) => value.key[idx] === byte)),
    createAddChange: (value) => ({ type: 'storageItem', value }),
    createDeleteChange: (storageKey) => ({ type: 'storageItem', key: storageKey }),
  });

  test('add/update/delete properly', async () => {
    const firstGet = await storageCache.tryGet({ hash, key });
    expect(firstGet).toBeUndefined();

    const storageItem = new StorageItem({ hash, key, value: Buffer.from('hello', 'utf-8'), flags: StorageFlags.None });
    await storageCache.add(storageItem);

    const secondGet = await storageCache.tryGet({ hash, key });
    expect(secondGet).toEqual(storageItem);

    await storageCache.delete({ hash, key });
    const thirdGet = await storageCache.tryGet({ hash, key });
    expect(thirdGet).toBeUndefined();

    await storageCache.add(storageItem);
    await storageCache.update(storageItem, { value: Buffer.from('hoho'), flags: StorageFlags.None });
    await storageCache.delete(storageItem);
    const fourthGet = await storageCache.tryGet({ hash, key });
    expect(fourthGet).toBeUndefined();
  });
});
