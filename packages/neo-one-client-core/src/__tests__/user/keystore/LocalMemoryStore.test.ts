import { factory } from '../../../__data__';
import { LocalMemoryStore } from '../../../user/keystore/LocalMemoryStore';

describe('LocalMemoryStore', () => {
  const wallet = factory.createUnlockedWallet();
  const store = new LocalMemoryStore();

  test('getWallets', async () => {
    await expect(store.getWallets()).resolves.toEqual([]);
  });

  test('getWalletsSync', () => {
    expect(store.getWalletsSync()).toEqual([]);
  });

  test('saveWallet', async () => {
    await expect(store.saveWallet(wallet)).resolves.toBeUndefined();
  });

  test('deleteWallet', async () => {
    await expect(store.deleteWallet(wallet)).resolves.toBeUndefined();
  });
});
