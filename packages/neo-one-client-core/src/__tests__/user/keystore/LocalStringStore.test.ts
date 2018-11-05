import { factory } from '../../../__data__';
import { LocalStringStore } from '../../../user/keystore/LocalStringStore';

describe('LocalStringStore', () => {
  const createStorage = () => {
    const mutableItems: { [key: string]: string } = {};

    return {
      setItem: async (key: string, value: string) => {
        mutableItems[key] = value;
      },
      getItem: async (key: string) => {
        const value = mutableItems[key] as string | undefined;
        if (value === undefined) {
          throw new Error(`Key not found: ${key}`);
        }

        return value;
      },
      removeItem: async (key: string) => {
        // tslint:disable-next-line no-dynamic-delete
        delete mutableItems[key];
      },
      getAllKeys: async () => Object.keys(mutableItems),
    };
  };

  let store: LocalStringStore;
  beforeEach(() => {
    store = new LocalStringStore(createStorage());
  });

  test('getWallets', async () => {
    const result = await store.getWallets();

    expect(result).toHaveLength(0);
  });

  test('saveWallet', async () => {
    const wallet = factory.createUnlockedWallet();

    await store.saveWallet(wallet);

    const result = await store.getWallets();
    expect(result).toHaveLength(1);
    expect(result[0].type).toEqual('locked');
    expect(result[0].account).toEqual(wallet.account);
    expect(result[0].nep2).toEqual(wallet.nep2);
  });

  test('saveWallet - locked wallet', async () => {
    const wallet = factory.createLockedWallet();

    await store.saveWallet(wallet);

    const result = await store.getWallets();
    expect(result).toHaveLength(1);
    expect(result[0].type).toEqual('locked');
    expect(result[0].account).toEqual(wallet.account);
    expect(result[0].nep2).toEqual(wallet.nep2);
  });

  test('saveWallet - nep2 undefined', async () => {
    const { nep2: _unused, ...wallet } = factory.createUnlockedWallet();

    const result = store.saveWallet(wallet);

    await expect(result).rejects.toMatchSnapshot();
  });

  test('deleteWallet', async () => {
    const wallet = factory.createUnlockedWallet();

    await store.saveWallet(wallet);
    await store.deleteWallet(wallet);

    const result = await store.getWallets();
    expect(result).toHaveLength(0);
  });
});
