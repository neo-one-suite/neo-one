import { take } from 'rxjs/operators';
import { addKeysToCrypto, factory, keys } from '../../../__data__';
import { LocalKeyStore, Store } from '../../../user';

describe('LocalKeyStore', () => {
  addKeysToCrypto();

  const network = 'local';
  const type = 'mock';
  const getWallets = jest.fn();
  const getWalletsSync = jest.fn();
  const saveWallet = jest.fn();
  const deleteWallet = jest.fn();
  const store: Store = {
    type,
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
    keystore = new LocalKeyStore({ store });
  });

  test('type', () => {
    const result = keystore.type;

    expect(result).toEqual(type);
  });

  test('currentUserAccount$', async () => {
    const result = await keystore.currentUserAccount$.pipe(take(1)).toPromise();

    expect(result).toEqual(lockedWallet.account);
  });

  test('userAccounts$', async () => {
    const result = await keystore.userAccounts$.pipe(take(1)).toPromise();

    expect(result).toEqual([lockedWallet.account, unlockedWallet.account]);
  });

  test('wallets$', async () => {
    const result = await keystore.wallets$.pipe(take(1)).toPromise();

    expect(result).toEqual([lockedWallet, unlockedWallet]);
  });

  test('getCurrentUserAccount', () => {
    const result = keystore.getCurrentUserAccount();

    expect(result).toEqual(lockedWallet.account);
  });

  test('getUserAccounts', () => {
    const result = keystore.getUserAccounts();

    expect(result).toEqual([lockedWallet.account, unlockedWallet.account]);
  });

  test('wallets', () => {
    const result = keystore.wallets;

    expect(result).toEqual([lockedWallet, unlockedWallet]);
  });

  test('sign', async () => {
    const message = 'hello world';

    const result = await keystore.sign({ account: unlockedWallet.account.id, message });

    expect(result).toMatchSnapshot();
  });

  test('sign - locked', async () => {
    const message = 'hello world';

    const result = keystore.sign({ account: lockedWallet.account.id, message });

    await expect(result).rejects.toMatchSnapshot();
  });

  test('selectUserAccount', async () => {
    await keystore.selectUserAccount(unlockedWallet.account.id);

    expect(keystore.getCurrentUserAccount()).toEqual(unlockedWallet.account);

    await keystore.selectUserAccount();

    expect(keystore.getCurrentUserAccount()).toEqual(lockedWallet.account);
  });

  test('updateUserAccountName - locked', async () => {
    const name = 'new name';
    await keystore.updateUserAccountName({ id: lockedWallet.account.id, name });

    expect(saveWallet.mock.calls).toMatchSnapshot();
    expect(keystore.getWallet(lockedWallet.account.id).account.name).toEqual(name);
  });

  test('updateUserAccountName - unlocked', async () => {
    const name = 'new name';
    await keystore.updateUserAccountName({ id: unlockedWallet.account.id, name });

    expect(saveWallet.mock.calls).toMatchSnapshot();
    expect(keystore.getWallet(unlockedWallet.account.id).account.name).toEqual(name);
  });

  test('getWallet - locked', () => {
    const result = keystore.getWallet(lockedWallet.account.id);

    expect(result).toEqual(lockedWallet);
  });

  test('getWallet - unlocked', () => {
    const result = keystore.getWallet(unlockedWallet.account.id);

    expect(result).toEqual(unlockedWallet);
  });

  test('getWallet - unknown network', () => {
    expect(() =>
      keystore.getWallet({ network: 'unknown', address: unlockedWallet.account.id.address }),
    ).toThrowErrorMatchingSnapshot();
  });

  test('getWallet - unknown address', () => {
    expect(() =>
      keystore.getWallet({ network: unlockedWallet.account.id.network, address: keys[2].address }),
    ).toThrowErrorMatchingSnapshot();
  });

  test('getWallet$', async () => {
    const result = await keystore
      .getWallet$(lockedWallet.account.id)
      .pipe(take(1))
      .toPromise();

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
    account: {
      type,
      id: {
        network,
        address: keys[2].address,
      },
      name,
      publicKey: keys[2].publicKeyString,
      configurableName: true,
      deletable: true,
    },
    nep2,
    privateKey: keys[2].privateKeyString,
  });

  test('addAccount - privateKey', async () => {
    const result = await keystore.addAccount({ network, privateKey: keys[2].privateKeyString });

    expect(result).toEqual(createExpectedPrivateKeyWallet({}));
  });

  test('addAccount - privateKey with name', async () => {
    const name = 'foobar';

    const result = await keystore.addAccount({ network, privateKey: keys[2].privateKeyString, name });

    expect(result).toEqual(createExpectedPrivateKeyWallet({ name }));
  });

  test('addAccount - privateKey with password', async () => {
    const result = await keystore.addAccount({
      network,
      privateKey: keys[2].privateKeyString,
      password: keys[2].password,
    });

    expect(result).toEqual(createExpectedPrivateKeyWallet({ nep2: keys[2].encryptedWIF }));
  });

  test('addAccount - nep2 and password', async () => {
    const result = await keystore.addAccount({
      network,
      nep2: keys[2].encryptedWIF,
      password: keys[2].password,
    });

    expect(result).toEqual(createExpectedPrivateKeyWallet({ nep2: keys[2].encryptedWIF }));
  });

  test('addAccount - nep2 without password', async () => {
    const result = keystore.addAccount({
      network,
      nep2: keys[2].encryptedWIF,
    });

    await expect(result).rejects.toMatchSnapshot();
  });

  test('addAccount - no private key', async () => {
    const result = keystore.addAccount({ network });

    await expect(result).rejects.toMatchSnapshot();
  });

  test('deleteUserAccount - all and add back', async () => {
    await keystore.deleteUserAccount(lockedWallet.account.id);

    expect(keystore.wallets).toHaveLength(1);
    expect(keystore.wallets[0]).toEqual(unlockedWallet);

    await keystore.deleteUserAccount(unlockedWallet.account.id);

    expect(keystore.wallets).toHaveLength(0);

    await keystore.addAccount({ network: unlockedWallet.account.id.network, privateKey: unlockedWallet.privateKey });

    expect(keystore.wallets).toHaveLength(1);
    expect(deleteWallet.mock.calls).toMatchSnapshot();
  });

  test('deleteUserAccount - unknown network', async () => {
    await keystore.deleteUserAccount({ network: 'unknown', address: lockedWallet.account.id.address });

    expect(keystore.wallets).toHaveLength(2);
  });

  test('deleteUserAccount - unknown address', async () => {
    await keystore.deleteUserAccount({ network: lockedWallet.account.id.network, address: keys[2].address });

    expect(keystore.wallets).toHaveLength(2);
  });

  test('unlockWallet', async () => {
    await keystore.unlockWallet({ id: lockedWallet.account.id, password: keys[1].password });

    expect(keystore.wallets).toHaveLength(2);
    expect(keystore.wallets[0].type).toBe('unlocked');
    expect(keystore.wallets[1].type).toBe('unlocked');
  });

  test('unlockWallet - already unlocked', async () => {
    await keystore.unlockWallet({ id: unlockedWallet.account.id, password: keys[0].password });

    expect(keystore.wallets).toHaveLength(2);
    expect(keystore.wallets[0].type).toBe('locked');
    expect(keystore.wallets[1].type).toBe('unlocked');
  });

  test('lockWallet', async () => {
    await keystore.lockWallet(unlockedWallet.account.id);

    expect(keystore.wallets).toHaveLength(2);
    expect(keystore.wallets[0].type).toBe('locked');
    expect(keystore.wallets[1].type).toBe('locked');
  });

  test('lockWallet - already locked', async () => {
    await keystore.lockWallet(lockedWallet.account.id);

    expect(keystore.wallets).toHaveLength(2);
    expect(keystore.wallets[0].type).toBe('locked');
    expect(keystore.wallets[1].type).toBe('unlocked');
  });
});
