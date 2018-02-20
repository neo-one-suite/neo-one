/* @flow */
import LocalMemoryStore from '../../../user/keystore/LocalMemoryStore';

describe('LocalMemoryStore', () => {
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
  const localMemoryStore = new LocalMemoryStore();

  test('type', () => {
    expect(localMemoryStore.type).toEqual('memory');
    const typeStore = new LocalMemoryStore('newType');
    expect(typeStore.type).toEqual('newType');
  });

  test('getWallets', async () => {
    await expect(localMemoryStore.getWallets()).resolves.toEqual([]);
  });

  test('saveWallet', async () => {
    await expect(localMemoryStore.saveWallet(wallet)).resolves.toEqual();
  });

  test('deleteWallet', async () => {
    await expect(localMemoryStore.deleteWallet(wallet)).resolves.toEqual();
  });
});
