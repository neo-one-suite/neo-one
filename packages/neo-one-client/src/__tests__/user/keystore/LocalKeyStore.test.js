/* @flow */
import { common, crypto } from '@neo-one/client-core';

import LocalKeyStore from '../../../user/keystore/LocalKeyStore';
import { LockedAccountError, UnknownAccountError } from '../../../errors';
import * as helpers from '../../../helpers';

describe('LocalKeyStore', () => {
  const id1 = {
    network: 'net1',
    address: 'addr1',
  };
  const id2 = {
    network: 'net2',
    address: 'addr2',
  };
  const account1 = {
    type: 'test',
    id: id1,
    name: 'name1',
    scriptHash: 'scriptHash1',
    publicKey: 'publicKey1',
    configurableName: true,
    deletable: true,
  };
  const account2 = {
    type: 'test',
    id: id2,
    name: 'name2',
    scriptHash: 'scriptHash2',
    publicKey: 'publicKey2',
    configurableName: true,
    deletable: true,
  };
  const wallet1 = {
    type: 'unlocked',
    account: account1,
    privateKey: 'privateKey1',
    nep2: 'nep21',
  };
  const wallet2 = {
    type: 'unlocked',
    account: account2,
    privateKey: 'privateKey2',
    nep2: undefined,
  };
  let wallets = [wallet1];
  const store = {
    type: 'test',
    getWallets: () => Promise.resolve(wallets),
    saveWallet: wallet => {
      wallets.push(wallet);
      return Promise.resolve();
    },
    deleteWallet: wallet => {
      wallets.splice(wallets.indexOf(wallet), 1);
      return Promise.resolve();
    },
  };

  let localKeyStore = new LocalKeyStore({ store });
  beforeEach(() => {
    wallets = [wallet1];
    localKeyStore = new LocalKeyStore({ store });
  });

  test('wallets get', () => {
    expect(localKeyStore.wallets).toEqual({ net1: { addr1: wallet1 } });
  });

  test('wallets get - same network', async () => {
    const id = {
      network: 'net1',
      address: 'addr',
    };
    const account = {
      type: 'test',
      id,
      name: 'addr',
      scriptHash: 'scriptHashNew',
      publicKey: 'publicKeyNew',
      configurableName: true,
      deletable: true,
    };
    const wallet = {
      account,
      privateKey: 'privateKeyNew',
      nep2: 'nep2New',
      type: 'unlocked',
    };

    wallets = [wallet1, wallet];
    localKeyStore = await new LocalKeyStore({ store });

    expect(localKeyStore.wallets).toEqual({
      net1: { addr1: wallet1, addr: wallet },
    });
  });

  test('getCurrentAccount', () => {
    expect(localKeyStore.getCurrentAccount()).toEqual(account1);
  });

  test('getAccounts', () => {
    expect(localKeyStore.getAccounts()).toEqual([account1]);
  });

  test('currentAccount', () => {
    expect(localKeyStore.currentAccount).toEqual(account1);
  });

  test('sign', async () => {
    const witness = {
      verification: 'ff',
      invocation: 'aa',
    };
    // $FlowFixMe
    crypto.createWitness = jest.fn(() => witness);
    // $FlowFixMe
    common.stringToPrivateKey = jest.fn(() => witness);

    const result = await localKeyStore.sign({
      account: id1,
      message: 'm1',
    });

    expect(result).toEqual({
      verification: 'ff',
      invocation: 'aa',
    });
  });

  test('sign locked account', async () => {
    const walletLocked = {
      type: 'locked',
      account: account1,
      nep2: wallet1.nep2,
    };
    wallets = [walletLocked];

    localKeyStore = await new LocalKeyStore({ store });

    await expect(
      localKeyStore.sign({
        account: id1,
        message: 'm1',
      }),
    ).rejects.toEqual(new LockedAccountError(id1.address));
  });

  test('addAccount throws error on missing private key & password+nep2', async () => {
    // $FlowFixMe
    helpers.privateKeyToPublicKey = jest.fn(() => account2.publicKey);
    // $FlowFixMe
    helpers.publicKeyToScriptHash = jest.fn(() => account2.scriptHash);
    // $FlowFixMe
    helpers.scriptHashToAddress = jest.fn(() => id2.address);

    const result = localKeyStore.addAccount({
      network: 'main',
      name: account2.name,
    });

    expect(result).rejects.toEqual(
      new Error('Expected private key or password and NEP-2 key'),
    );
  });

  test('addAccount sets privateKey when given nep2+password', async () => {
    localKeyStore = new LocalKeyStore({ store });
    const idMain = {
      network: 'main',
      address: 'addrMain',
    };
    const accountMain = {
      type: 'test',
      id: idMain,
      name: 'addrMain',
      scriptHash: 'scriptHashMain',
      publicKey: 'publicKeyMain',
      configurableName: true,
      deletable: true,
    };
    const walletMain = {
      account: accountMain,
      privateKey: 'privateKeyMain',
      nep2: 'nep2Main',
      type: 'unlocked',
    };
    // $FlowFixMe
    helpers.privateKeyToPublicKey = jest.fn(() => accountMain.publicKey);
    // $FlowFixMe
    helpers.publicKeyToScriptHash = jest.fn(() => accountMain.scriptHash);
    // $FlowFixMe
    helpers.scriptHashToAddress = jest.fn(() => idMain.address);
    // $FlowFixMe
    helpers.decryptNEP2 = jest.fn(() => Promise.resolve(walletMain.privateKey));

    const result = await localKeyStore.addAccount({
      network: 'main',
      password: 'pass',
      nep2: 'nep2Main',
    });

    expect(result).toEqual(walletMain);
  });

  test('addAccount sets nep2 when given privateKey+password and is set to current account', async () => {
    localKeyStore = new LocalKeyStore({ store });
    const idMain = {
      network: 'main',
      address: 'addrMain',
    };
    const accountMain = {
      type: 'test',
      id: idMain,
      name: 'addrMain',
      scriptHash: 'scriptHashMain',
      publicKey: 'publicKeyMain',
      configurableName: true,
      deletable: true,
    };
    const walletMain = {
      account: accountMain,
      privateKey: 'privateKeyMain',
      nep2: 'nep2Main',
      type: 'unlocked',
    };
    // $FlowFixMe
    helpers.privateKeyToPublicKey = jest.fn(() => accountMain.publicKey);
    // $FlowFixMe
    helpers.publicKeyToScriptHash = jest.fn(() => accountMain.scriptHash);
    // $FlowFixMe
    helpers.scriptHashToAddress = jest.fn(() => idMain.address);
    // $FlowFixMe
    helpers.encryptNEP2 = jest.fn(() => Promise.resolve(walletMain.nep2));

    const result = await localKeyStore.addAccount({
      network: 'main',
      privateKey: 'privateKeyMain',
      password: 'pass',
    });

    expect(result).toEqual(walletMain);
  });

  test('construct with null network', async () => {
    wallets = [];
    localKeyStore = await new LocalKeyStore({ store });
    expect(localKeyStore.wallets).toEqual({});
  });

  test('addAccount', async () => {
    // $FlowFixMe
    helpers.privateKeyToPublicKey = jest.fn(() => account2.publicKey);
    // $FlowFixMe
    helpers.publicKeyToScriptHash = jest.fn(() => account2.scriptHash);
    // $FlowFixMe
    helpers.scriptHashToAddress = jest.fn(() => id2.address);

    expect(localKeyStore.wallets).toEqual({ net1: { addr1: wallet1 } });

    const result = await localKeyStore.addAccount({
      network: id2.network,
      privateKey: 'privateKey2',
      name: account2.name,
    });

    expect(result).toEqual(wallet2);
    expect(localKeyStore.wallets).toEqual({
      net1: { addr1: wallet1 },
      net2: { addr2: wallet2 },
    });
  });

  test('selectAccount', async () => {
    expect(localKeyStore.getCurrentAccount()).toEqual(account1);

    await localKeyStore.addAccount({
      network: id2.network,
      privateKey: 'privateKey2',
      name: account2.name,
    });
    await localKeyStore.selectAccount(id2);

    expect(localKeyStore.getCurrentAccount()).toEqual(account2);
  });

  test('selectAccount with null id', async () => {
    expect(localKeyStore.getCurrentAccount()).toEqual(account1);

    await localKeyStore.selectAccount();

    expect(localKeyStore.getCurrentAccount()).toEqual(null);
  });

  test('updateAccountName - unlocked wallet', async () => {
    const updateAccount = {
      type: 'test',
      id: id1,
      name: 'newName',
      scriptHash: 'scriptHash1',
      publicKey: 'publicKey1',
      configurableName: true,
      deletable: true,
    };

    await localKeyStore.updateAccountName({
      id: id1,
      name: 'newName',
    });

    const result = localKeyStore.getWallet(id1);
    expect(result).toEqual({
      type: 'unlocked',
      account: updateAccount,
      privateKey: wallet1.privateKey,
      nep2: wallet1.nep2,
    });
  });

  test('updateAccountName - locked wallet', async () => {
    const updateAccount = {
      type: 'test',
      id: id1,
      name: 'newName',
      scriptHash: 'scriptHash1',
      publicKey: 'publicKey1',
      configurableName: true,
      deletable: true,
    };
    const wallet = {
      type: 'locked',
      account: account1,
      nep2: wallet1.nep2,
    };

    wallets = [wallet];
    localKeyStore = await new LocalKeyStore({ store });

    await localKeyStore.updateAccountName({
      id: id1,
      name: 'newName',
    });

    const result = localKeyStore.getWallet(id1);
    expect(result).toEqual({
      type: 'locked',
      account: updateAccount,
      nep2: wallet1.nep2,
    });
  });

  test('getWallet throws error on unknown network', async () => {
    const fakeID = { network: 'fakeNet', address: 'addr1' };
    function testError() {
      localKeyStore.getWallet(fakeID);
    }

    expect(testError).toThrow(new UnknownAccountError(fakeID.address));
  });

  test('getWallet throws error on unknown address', async () => {
    const fakeID = { network: 'net1', address: 'fakeAddress' };
    function testError() {
      localKeyStore.getWallet(fakeID);
    }

    expect(testError).toThrow(new UnknownAccountError(fakeID.address));
  });

  test('getWallet', async () => {
    const result = await localKeyStore.getWallet(id1);
    expect(result).toEqual(wallet1);
  });

  test('deleteAccount - current account', async () => {
    await localKeyStore.deleteAccount(id1);
    expect(localKeyStore.wallets).toEqual({ net1: {} });
    expect(localKeyStore.getCurrentAccount()).toEqual();
  });

  test('deleteAccount - non current account', async () => {
    // $FlowFixMe
    helpers.privateKeyToPublicKey = jest.fn(() => account2.publicKey);
    // $FlowFixMe
    helpers.publicKeyToScriptHash = jest.fn(() => account2.scriptHash);
    // $FlowFixMe
    helpers.scriptHashToAddress = jest.fn(() => id2.address);

    await localKeyStore.addAccount({
      network: id2.network,
      privateKey: 'privateKey2',
      name: account2.name,
    });

    await localKeyStore.deleteAccount(id2);
    expect(localKeyStore.wallets).toEqual({
      net1: { addr1: wallet1 },
      net2: {},
    });
  });

  test('addAccount - no current account', async () => {
    // $FlowFixMe
    helpers.privateKeyToPublicKey = jest.fn(() => account2.publicKey);
    // $FlowFixMe
    helpers.publicKeyToScriptHash = jest.fn(() => account2.scriptHash);
    // $FlowFixMe
    helpers.scriptHashToAddress = jest.fn(() => id2.address);

    await localKeyStore.deleteAccount(id1);
    expect(localKeyStore.currentAccount).toEqual();

    await localKeyStore.addAccount({
      network: id2.network,
      privateKey: 'privateKey2',
      name: account2.name,
    });
    expect(localKeyStore.currentAccount).toEqual(account2);
  });

  test('deleteAccount - network not found', async () => {
    const fakeID = { network: 'fakeNet', address: 'addr1' };
    await localKeyStore.deleteAccount(fakeID);
    expect(localKeyStore.wallets).toEqual({ net1: { addr1: wallet1 } });
  });

  test('deleteAccount - address not found', async () => {
    const fakeID = { network: 'net1', address: 'fakeAddr' };
    await localKeyStore.deleteAccount(fakeID);
    expect(localKeyStore.wallets).toEqual({ net1: { addr1: wallet1 } });
  });

  test('unlockWallet with private key', async () => {
    await localKeyStore.unlockWallet({
      id: id1,
      password: 'pass',
    });

    expect(localKeyStore.wallets).toEqual({ net1: { addr1: wallet1 } });
  });

  test('unlockWallet with nep2', async () => {
    const idMain = {
      network: 'main',
      address: 'addrMain',
    };
    const accountMain = {
      type: 'test',
      id: idMain,
      name: 'addrMain',
      scriptHash: 'scriptHashMain',
      publicKey: 'publicKeyMain',
      configurableName: true,
      deletable: true,
    };
    const walletMain = {
      type: 'locked',
      account: accountMain,
      nep2: 'nep2Main',
    };
    wallets = [walletMain];

    const privateKey = 'privateKeyMain';
    const walletUpdated = {
      account: accountMain,
      privateKey,
      nep2: 'nep2Main',
      type: 'unlocked',
    };

    localKeyStore = await new LocalKeyStore({ store });

    // $FlowFixMe
    helpers.decryptNEP2 = jest.fn(() => Promise.resolve(privateKey));

    await localKeyStore.unlockWallet({
      id: idMain,
      password: 'pass',
    });

    expect(localKeyStore.wallets).toEqual({
      main: { addrMain: walletUpdated },
    });
  });

  test('unlockWallet throws error on null nep2 & private key', async () => {
    const walletError = ({
      account: account1,
      privateKey: undefined,
      nep2: undefined,
    }: $FlowFixMe);
    wallets = [walletError];

    localKeyStore = await new LocalKeyStore({ store });

    await expect(
      localKeyStore.unlockWallet({
        id: id1,
        password: 'pass',
      }),
    ).rejects.toThrow(
      new Error('Unexpected error, privateKey and NEP2 were both null.'),
    );
  });

  test('lockWallet', () => {
    const walletUpdated = {
      type: 'locked',
      account: account1,
      nep2: wallet1.nep2,
    };
    localKeyStore.lockWallet(id1);

    expect(localKeyStore.wallets).toEqual({ net1: { addr1: walletUpdated } });
  });

  test('lockWallet - null nep2 or privateKey - already locked', async () => {
    const walletUpdated = {
      type: 'locked',
      account: account1,
      nep2: wallet1.nep2,
    };
    wallets = [walletUpdated];

    localKeyStore = await new LocalKeyStore({ store });

    localKeyStore.lockWallet(id1);

    expect(localKeyStore.wallets).toEqual({ net1: { addr1: walletUpdated } });
  });
});
