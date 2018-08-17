import { factory } from '../../../__data__';
import { LocalMemoryStore } from '../../../user/keystore/LocalMemoryStore';

describe('LocalMemoryStore', () => {
  const wallet = factory.createUnlockedWallet();
  const store = new LocalMemoryStore();

  test('type', () => {
    expect(store.type).toEqual('memory');
  });

  test('explicit type', () => {
    const type = 'foo';

    expect(new LocalMemoryStore(type).type).toEqual(type);
  });

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
