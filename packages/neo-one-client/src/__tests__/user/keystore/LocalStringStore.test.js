/* @flow */
import LocalStringStore from '../../../user/keystore/LocalStringStore';

describe('LocalStringStore', () => {
  const wallet = {
    type: 'unlocked',
    account: {
      type: 'test',
      id: {
        network: 'net',
        address: 'addr',
      },
      name: 'name1',
      scriptHash: 'scriptHash1',
      publicKey: 'publicKey1',
      configurableName: true,
      deletable: true,
    },
    privateKey: 'privateKey1',
    nep2: 'nep21',
  };
  const keys = ['key1', 'key2'];
  const items = {
    key1: '{"item1": 1}',
    key2: '{"item2": 2}',
  };
  const storage = {
    setItem: (key: string, value: string) => {
      keys.push(key);
      items[key] = value;
      return Promise.resolve();
    },
    getItem: (key: string) => Promise.resolve(items[key]),
    removeItem: (key: string) => {
      keys.splice(keys.indexOf(key), 1);
      delete items[key];
    },
    getAllKeys: () => Promise.resolve(keys),
  };

  const localStringStore = new LocalStringStore({ type: 'type', storage });

  test('getWallets', async () => {
    const expected = [{ item1: 1 }, { item2: 2 }];
    const result = await localStringStore.getWallets();

    expect(result).toEqual(expected);
  });

  test('saveWallet', async () => {
    const expected = [{ item1: 1 }, { item2: 2 }];

    await expect(localStringStore.getWallets()).resolves.toEqual(expected);

    expected.push(wallet);
    await localStringStore.saveWallet(wallet);

    await expect(localStringStore.getWallets()).resolves.toEqual(expected);
  });

  test('deleteWallet', async () => {
    const expected = [{ item1: 1 }, { item2: 2 }, wallet];

    await expect(localStringStore.getWallets()).resolves.toEqual(expected);

    expected.splice(2, 1);
    await localStringStore.deleteWallet(wallet);

    await expect(localStringStore.getWallets()).resolves.toEqual(expected);
  });
});
