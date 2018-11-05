import { common, crypto } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { of } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import {
  ConnectedHandler,
  Handler,
  Ledger,
  LedgerKeyStore,
  LedgerProvider,
  Ledgers,
} from '../../../user/keystore/LedgerKeyStore';

const testMessage =
  '8000000185e7e907cc5c5683e7fc926ba4be613d1810aebe14686b3675ee27d2476e5201000002e72d286979ee6cb1b7e65dfddfb2e384100b8d148e7758de42e4168b71792c60a08601000000000013354f4f5d3f989a221c794271e0bb2471c2735ee72d286979ee6cb1b7e65dfddfb2e384100b8d148e7758de42e4168b71792c60e23f01000000000013354f4f5d3f989a221c794271e0bb2471c2735e';

const flattenLedgers = (ledgers: Ledgers) =>
  _.flatten(
    Object.values(ledgers)
      .filter(utils.notNull)
      .map((networkLedgers) => Object.values(networkLedgers)),
  ).filter(utils.notNull);

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

  const networks = ['test'];
  const networks$ = of(networks);
  const getAccount = jest.fn();

  const ledgerProvider: LedgerProvider = {
    networks$,
    getAccount,
    getNetworks: () => networks,
  };

  const indexAccount = {
    id: {
      network: 'test',
      address: 'ARL4VYQWxSwigpRsCsucLxovujKDmwYeTd',
    },
    name: '0',
    publicKey: '03d81d462f80d55ff234b1b221e46d52e4da3f93c465edbbaeebd742bc1947fe6d',
  };

  const secondaryAccount = {
    id: {
      network: 'test',
      address: 'AJGCVgoLp3bU57zd4k6mcpedWr45Em8dFD',
    },
    name: '1',
    publicKey: '031546889cf12577237536380e86b2587d55743f9d4dac8879f332b79ce1a84cd6',
  };

  const indexLedger: Ledger = {
    accountKey: 0,
    account: indexAccount,
  };

  const secondaryLedger: Ledger = {
    accountKey: 1,
    account: secondaryAccount,
  };

  const mockConnectedHandler: ConnectedHandler = {
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

  const mockHandler: Handler = {
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
    const [currentAccount, accounts] = await Promise.all([
      keystore.currentAccount$
        .pipe(
          filter((value) => value !== undefined),
          take(1),
        )
        .toPromise(),
      keystore.accounts$
        .pipe(
          filter((value) => value.length > 0),
          take(1),
        )
        .toPromise(),
    ]);
    expect(currentAccount).toEqual(indexAccount);
    expect(accounts).toEqual([indexAccount, secondaryAccount]);
  });

  test('byteLimit', () => {
    const result = keystore.byteLimit;

    expect(result).toEqual(2048);
  });

  test('getAccounts', async () => {
    const result = keystore.getAccounts();

    expect(result).toEqual([indexAccount, secondaryAccount]);
  });

  test('ledgers', async () => {
    const result = keystore.ledgers;

    expect(flattenLedgers(result)).toEqual([indexLedger, secondaryLedger]);
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
    await keystore.currentAccount$
      .pipe(
        filter((value) => value !== undefined),
        take(1),
      )
      .toPromise();

    const accounts = keystore.getAccounts();
    const account = keystore.getCurrentAccount();

    expect(accounts.length).toEqual(21);
    expect(account).toBeDefined();
  });

  test('sign', async () => {
    await keystore.accounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();

    const result = await keystore.sign({ account: indexLedger.account.id, message: testMessage });

    expect(result).toMatchSnapshot();
  });
});
