import { take } from 'rxjs/operators';
import { addKeysToCrypto, factory, keys } from '../../../__data__';
import { LocalKeyStore } from '../../../user';
import { LocalStore } from '../../../user/keystore/LocalKeyStore';

describe('LocalKeyStore', () => {
  addKeysToCrypto();

  const network = 'local';
  const getWallets = jest.fn();
  const getWalletsSync = jest.fn();
  const saveWallet = jest.fn();
  const deleteWallet = jest.fn();
  const store: LocalStore = {
    getWallets,
    getWalletsSync,
    saveWallet,
    deleteWallet,
  };

  const lockedWallet = factory.createLockedWallet();
  const unlockedWallet = factory.createUnlockedWallet();

  let keystore: LocalKeyStore;
  beforeEach(() => {
    getWallets.mockReset();
    getWalletsSync.mockReset();
    saveWallet.mockReset();
    deleteWallet.mockReset();
    getWalletsSync.mockImplementation(() => [lockedWallet, unlockedWallet]);
    getWallets.mockImplementation(() => [lockedWallet, unlockedWallet]);
    keystore = new LocalKeyStore(store);
  });

  test('currentUserAccount$', async () => {
    const result = await keystore.currentUserAccount$.pipe(take(1)).toPromise();

    expect(result).toEqual(lockedWallet.userAccount);
  });

  test('userAccounts$', async () => {
    const result = await keystore.userAccounts$.pipe(take(1)).toPromise();

    expect(result).toEqual([lockedWallet.userAccount, unlockedWallet.userAccount]);
  });

  test('wallets$', async () => {
    const result = await keystore.wallets$.pipe(take(1)).toPromise();

    expect(result).toEqual([lockedWallet, unlockedWallet]);
  });

  test('getCurrentUserAccount', () => {
    const result = keystore.getCurrentUserAccount();

    expect(result).toEqual(lockedWallet.userAccount);
  });

  test('getUserAccounts', () => {
    const result = keystore.getUserAccounts();

    expect(result).toEqual([lockedWallet.userAccount, unlockedWallet.userAccount]);
  });

  test('wallets', () => {
    const result = keystore.wallets;

    expect(result).toEqual([lockedWallet, unlockedWallet]);
  });

  test('sign', async () => {
    const message = 'hello world';

    const result = await keystore.sign({ account: unlockedWallet.userAccount.id, message });

    expect(result).toMatchSnapshot();
  });

  test('sign - locked', async () => {
    const message = 'hello world';

    const result = keystore.sign({ account: lockedWallet.userAccount.id, message });

    await expect(result).rejects.toMatchSnapshot();
  });

  test('selectUserAccount', async () => {
    await keystore.selectUserAccount(unlockedWallet.userAccount.id);

    expect(keystore.getCurrentUserAccount()).toEqual(unlockedWallet.userAccount);

    await keystore.selectUserAccount();

    expect(keystore.getCurrentUserAccount()).toEqual(lockedWallet.userAccount);
  });

  test('updateUserAccountName - locked', async () => {
    const name = 'new name';
    await keystore.updateUserAccountName({ id: lockedWallet.userAccount.id, name });

    expect(saveWallet.mock.calls).toMatchSnapshot();
    expect(keystore.getWallet(lockedWallet.userAccount.id).userAccount.name).toEqual(name);
  });

  test('updateUserAccountName - unlocked', async () => {
    const name = 'new name';
    await keystore.updateUserAccountName({ id: unlockedWallet.userAccount.id, name });

    expect(saveWallet.mock.calls).toMatchSnapshot();
    expect(keystore.getWallet(unlockedWallet.userAccount.id).userAccount.name).toEqual(name);
  });

  test('getWallet - locked', () => {
    const result = keystore.getWallet(lockedWallet.userAccount.id);

    expect(result).toEqual(lockedWallet);
  });

  test('getWallet - unlocked', () => {
    const result = keystore.getWallet(unlockedWallet.userAccount.id);

    expect(result).toEqual(unlockedWallet);
  });

  test('getWallet - unknown network', () => {
    expect(() =>
      keystore.getWallet({ network: 'unknown', address: unlockedWallet.userAccount.id.address }),
    ).toThrowErrorMatchingSnapshot();
  });

  test('getWallet - unknown address', () => {
    expect(() =>
      keystore.getWallet({ network: unlockedWallet.userAccount.id.network, address: keys[2].address }),
    ).toThrowErrorMatchingSnapshot();
  });

  test('getWallet$', async () => {
    const result = await keystore.getWallet$(lockedWallet.userAccount.id).pipe(take(1)).toPromise();

    expect(result).toEqual(lockedWallet);
  });

  test('getWallet$ - undefined', async () => {
    const result = await keystore
      .getWallet$({ network: 'unknown', address: keys[2].address })
      .pipe(take(1))
      .toPromise();

    expect(result).toBeUndefined();
  });

  const createExpectedPrivateKeyWallet = ({ name = keys[2].address, nep2 }: { name?: string; nep2?: string }) => ({
    type: 'unlocked',
    userAccount: {
      id: {
        network,
        address: keys[2].address,
      },
      name,
      publicKey: keys[2].publicKeyString,
    },
    nep2,
    privateKey: keys[2].privateKeyString,
  });

  test('addUserAccount - privateKey', async () => {
    const result = await keystore.addUserAccount({ network, privateKey: keys[2].privateKeyString });

    expect(result).toEqual(createExpectedPrivateKeyWallet({}));
  });

  test('addUserAccount - privateKey with name', async () => {
    const name = 'foobar';

    const result = await keystore.addUserAccount({ network, privateKey: keys[2].privateKeyString, name });

    expect(result).toEqual(createExpectedPrivateKeyWallet({ name }));
  });

  test('addUserAccount - privateKey with password', async () => {
    const result = await keystore.addUserAccount({
      network,
      privateKey: keys[2].privateKeyString,
      password: keys[2].password,
    });

    expect(result).toEqual(createExpectedPrivateKeyWallet({ nep2: keys[2].encryptedWIF }));
  });

  test('addUserAccount - nep2 and password', async () => {
    const result = await keystore.addUserAccount({
      network,
      nep2: keys[2].encryptedWIF,
      password: keys[2].password,
    });

    expect(result).toEqual(createExpectedPrivateKeyWallet({ nep2: keys[2].encryptedWIF }));
  });

  test('addUserAccount - nep2 without password', async () => {
    const result = keystore.addUserAccount({
      network,
      nep2: keys[2].encryptedWIF,
    });

    await expect(result).rejects.toMatchSnapshot();
  });

  test('addUserAccount - no private key', async () => {
    const result = keystore.addUserAccount({ network });

    await expect(result).rejects.toMatchSnapshot();
  });

  test('deleteUserAccount - all and add back', async () => {
    await keystore.deleteUserAccount(lockedWallet.userAccount.id);

    expect(keystore.wallets).toHaveLength(1);
    expect(keystore.wallets[0]).toEqual(unlockedWallet);

    await keystore.deleteUserAccount(unlockedWallet.userAccount.id);

    expect(keystore.wallets).toHaveLength(0);

    await keystore.addUserAccount({
      network: unlockedWallet.userAccount.id.network,
      privateKey: unlockedWallet.privateKey,
    });

    expect(keystore.wallets).toHaveLength(1);
    expect(deleteWallet.mock.calls).toMatchSnapshot();
  });

  test('deleteUserAccount - unknown network', async () => {
    await keystore.deleteUserAccount({ network: 'unknown', address: lockedWallet.userAccount.id.address });

    expect(keystore.wallets).toHaveLength(2);
  });

  test('deleteUserAccount - unknown address', async () => {
    await keystore.deleteUserAccount({ network: lockedWallet.userAccount.id.network, address: keys[2].address });

    expect(keystore.wallets).toHaveLength(2);
  });

  test('unlockWallet', async () => {
    await keystore.unlockWallet({ id: lockedWallet.userAccount.id, password: keys[1].password });

    expect(keystore.wallets).toHaveLength(2);
    expect(keystore.wallets[0].type).toBe('unlocked');
    expect(keystore.wallets[1].type).toBe('unlocked');
  });

  test('unlockWallet - already unlocked', async () => {
    await keystore.unlockWallet({ id: unlockedWallet.userAccount.id, password: keys[0].password });

    expect(keystore.wallets).toHaveLength(2);
    expect(keystore.wallets[0].type).toBe('locked');
    expect(keystore.wallets[1].type).toBe('unlocked');
  });

  test('lockWallet', async () => {
    await keystore.lockWallet(unlockedWallet.userAccount.id);

    expect(keystore.wallets).toHaveLength(2);
    expect(keystore.wallets[0].type).toBe('locked');
    expect(keystore.wallets[1].type).toBe('locked');
  });

  test('lockWallet - already locked', async () => {
    await keystore.lockWallet(lockedWallet.userAccount.id);

    expect(keystore.wallets).toHaveLength(2);
    expect(keystore.wallets[0].type).toBe('locked');
    expect(keystore.wallets[1].type).toBe('unlocked');
  });
});
