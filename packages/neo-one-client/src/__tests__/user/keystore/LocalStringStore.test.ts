import { PasswordRequiredError } from '../../../errors';
import { UnlockedWallet } from '../../../user';
import { LocalStringStore } from '../../../user/keystore/LocalStringStore';

describe('LocalStringStore', () => {
  const wallet: UnlockedWallet = {
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
  let items: any = {
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
    const expected: any[] = [{ item1: 1 }, { item2: 2 }];

    await expect(localStringStore.getWallets()).resolves.toEqual(expected);

    expected.push(wallet);
    await localStringStore.saveWallet(wallet);

    await expect(localStringStore.getWallets()).resolves.toEqual(expected);
  });

  test('saveWallet throws error missing password for main net wallet', async () => {
    const passWallet: UnlockedWallet = {
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
      nep2: undefined,
    };

    const result = localStringStore.saveWallet(passWallet);

    await expect(result).rejects.toEqual(new PasswordRequiredError());
  });

  test('saveWallet removes privateKey of password protected wallets', async () => {
    const expected: any[] = [{ item1: 1 }, { item2: 2 }];
    const passWallet: UnlockedWallet = {
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
    (passWallet as any).type = 'locked';
    delete (passWallet as any).privateKey;
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
