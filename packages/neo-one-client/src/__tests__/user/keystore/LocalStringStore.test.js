/* @flow */
import LocalStringStore from '../../../user/keystore/LocalStringStore';
import { PasswordRequiredError } from '../../../errors';

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
  let keys = ['key1', 'key2'];
  let items = {
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
      return Promise.resolve();
    },
    getAllKeys: () => Promise.resolve(keys),
  };

  let localStringStore = new LocalStringStore({ type: 'type', storage });
  beforeEach(() => {
    keys = ['key1', 'key2'];
    items = {
      key1: '{"item1": 1}',
      key2: '{"item2": 2}',
    };
    localStringStore = new LocalStringStore({ type: 'type', storage });
  });

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

  test('saveWallet throws error missing password for main net wallet', async () => {
    const passWallet = {
      type: 'unlocked',
      account: {
        type: 'test',
        id: {
          network: 'main',
          address: 'addr',
        },
        name: 'name1',
        scriptHash: 'scriptHash1',
        publicKey: 'publicKey1',
        configurableName: true,
        deletable: true,
      },
      privateKey: 'privateKey1',
      nep2: null,
    };

    const result = localStringStore.saveWallet(passWallet);

    await expect(result).rejects.toEqual(new PasswordRequiredError());
  });

  test('saveWallet removes privateKey of password protected wallets', async () => {
    const expected = [{ item1: 1 }, { item2: 2 }];
    const passWallet = {
      type: 'unlocked',
      account: {
        type: 'test',
        id: {
          network: 'main',
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
    await localStringStore.saveWallet(passWallet);
    passWallet.type = 'locked';
    delete passWallet.privateKey;
    expected.push(passWallet);
    await expect(localStringStore.getWallets()).resolves.toEqual(expected);
  });

  test('deleteWallet', async () => {
    const expected = [{ item1: 1 }, { item2: 2 }, wallet];
    await localStringStore.saveWallet(wallet);
    await expect(localStringStore.getWallets()).resolves.toEqual(expected);

    await localStringStore.deleteWallet(wallet);
    expected.splice(2, 1);
    await expect(localStringStore.getWallets()).resolves.toEqual(expected);
  });
});
