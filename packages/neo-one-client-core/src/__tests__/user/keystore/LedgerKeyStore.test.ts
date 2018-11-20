import { common, crypto } from '@neo-one/client-common';
import { DefaultMonitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { of } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { UnknownAccountError, UnknownNetworkError } from '../../../errors';
import { LedgerKeyStore, LedgerProvider } from '../../../user/keystore/LedgerKeyStore';

const testMessage =
  '8000000185e7e907cc5c5683e7fc926ba4be613d1810aebe14686b3675ee27d2476e5201000002e72d286979ee6cb1b7e65dfddfb2e384100b8d148e7758de42e4168b71792c60a08601000000000013354f4f5d3f989a221c794271e0bb2471c2735ee72d286979ee6cb1b7e65dfddfb2e384100b8d148e7758de42e4168b71792c60e23f01000000000013354f4f5d3f989a221c794271e0bb2471c2735e';

describe('LedgerKeyStore', () => {
  const emptyAccount = {
    balances: {
      ['dicarloin']: new BigNumber(0),
    },
  };

  const activeAccount = {
    balances: {
      ['dicarloin']: new BigNumber(1),
    },
  };

  const networks = ['test', 'main', 'test'];
  const networks$ = of(networks);
  const getAccount = jest.fn();

  const ledgerProvider: LedgerProvider = {
    networks$,
    getAccount,
    getNetworks: () => networks,
  };

  const indexAccount = (network: string) => ({
    id: {
      network,
      address: 'ARL4VYQWxSwigpRsCsucLxovujKDmwYeTd',
    },
    name: '0',
    publicKey: '03d81d462f80d55ff234b1b221e46d52e4da3f93c465edbbaeebd742bc1947fe6d',
  });

  const secondaryAccount = (network: string) => ({
    id: {
      network,
      address: 'AJGCVgoLp3bU57zd4k6mcpedWr45Em8dFD',
    },
    name: '1',
    publicKey: '031546889cf12577237536380e86b2587d55743f9d4dac8879f332b79ce1a84cd6',
  });

  const mockConnectedHandler = {
    getPublicKey: async (account?: number) => {
      switch (account === undefined || account > 1 ? 2 : account) {
        case 0: {
          return Promise.resolve('03d81d462f80d55ff234b1b221e46d52e4da3f93c465edbbaeebd742bc1947fe6d');
        }
        case 1: {
          return Promise.resolve('031546889cf12577237536380e86b2587d55743f9d4dac8879f332b79ce1a84cd6');
        }
        case 2: {
          return Promise.resolve(common.ecPointToString(crypto.privateKeyToPublicKey(crypto.createPrivateKey())));
        }
        default:
          throw new Error('how did this happen?');
      }
    },
    sign: async () =>
      Promise.resolve(
        Buffer.from(
          '30440220587176332925a4bb30990ea66426a826221b2f925cdb087b8d20fd5561bacc5102207c58ebef1b7e8337ee175680203bc6a5ba6269149641a0c3fe9899fb4b6414b6ffffe78096130342169ee4998f941f48dee0e07c535084da66696bd7edea52403ff1',
          'hex',
        ),
      ),
    close: async () => Promise.resolve(),
  };

  const mockHandler = {
    byteLimit: 2048,
    init: async () => Promise.resolve(mockConnectedHandler),
  };

  let keystore: LedgerKeyStore;

  beforeAll(() => {
    getAccount.mockReset();
    getAccount.mockImplementation(() => emptyAccount);
    keystore = new LedgerKeyStore(ledgerProvider, mockHandler);
  });

  afterAll(async () => {
    await keystore.close();
  });

  test('accounts$', async () => {
    const [currentUserAccount, accounts] = await Promise.all([
      keystore.currentUserAccount$
        .pipe(
          filter((value) => value !== undefined),
          take(1),
        )
        .toPromise(),
      keystore.userAccounts$
        .pipe(
          filter((value) => value.length > 0),
          take(1),
        )
        .toPromise(),
    ]);
    expect(currentUserAccount).toEqual(indexAccount('main'));
    expect(accounts).toEqual([
      indexAccount('test'),
      secondaryAccount('test'),
      indexAccount('main'),
      secondaryAccount('main'),
    ]);
  });

  test('byteLimit', () => {
    const result = keystore.byteLimit;

    expect(result).toEqual(2048);
  });

  test('selectUserAccount - currentUserAccount', async () => {
    await keystore.currentUserAccount$
      .pipe(
        filter((value) => value !== undefined),
        take(1),
      )
      .toPromise();

    expect(keystore.getCurrentUserAccount()).toEqual(indexAccount('main'));
    await keystore.selectUserAccount();
    expect(keystore.getCurrentUserAccount()).toEqual(undefined);
    await keystore.selectUserAccount(indexAccount('main').id);
    expect(keystore.getCurrentUserAccount()).toEqual(indexAccount('main'));
  });

  test('selectUserAccount - throws on bad network', async () => {
    const badNetwork = 'badNetwork';
    const getLedgersThrow = keystore.selectUserAccount({
      address: indexAccount('test').id.address,
      network: badNetwork,
    });

    await expect(getLedgersThrow).rejects.toEqual(new UnknownNetworkError(badNetwork));
  });

  test('selectUserAccount - throws on bad address', async () => {
    const badAddress = 'badAddress';
    const getLedgersThrow = keystore.selectUserAccount({
      address: badAddress,
      network: indexAccount('test').id.network,
    });

    await expect(getLedgersThrow).rejects.toEqual(new UnknownAccountError(badAddress));
  });

  test('getUserAccounts', () => {
    const result = keystore.getUserAccounts();

    expect(result).toEqual([
      indexAccount('test'),
      secondaryAccount('test'),
      indexAccount('main'),
      secondaryAccount('main'),
    ]);
  });

  test('getNetworks', () => {
    const result = keystore.getNetworks();

    expect(result).toEqual(networks);
  });

  test('mixed scan', async () => {
    await keystore.close();

    let count = 0;
    getAccount.mockReset();
    getAccount.mockImplementation(() => {
      if (count === 19) {
        count = count + 1;

        return activeAccount;
      }
      count = count + 1;

      return emptyAccount;
    });

    keystore = new LedgerKeyStore(ledgerProvider, mockHandler);
    await keystore.currentUserAccount$
      .pipe(
        filter((value) => value !== undefined),
        take(1),
      )
      .toPromise();

    const accounts = keystore.getUserAccounts();
    const account = keystore.getCurrentUserAccount();

    expect(accounts.length).toEqual(23);
    expect(account).toBeDefined();
  });

  test('sign', async () => {
    await keystore.userAccounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();

    const result = await keystore.sign({ account: indexAccount('test').id, message: testMessage });

    expect(result).toMatchSnapshot();
  });

  test('sign - with monitor', async () => {
    const monitor = DefaultMonitor.create({ service: 'test' });
    await keystore.userAccounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();

    const result = await keystore.sign({ account: indexAccount('test').id, message: testMessage, monitor });

    expect(result).toMatchSnapshot();
  });
});
