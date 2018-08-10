import { utils } from '@neo-one/utils';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { of } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { Ledger, LedgerKeyStore, LedgerProvider, Ledgers } from '../user/keystore/LedgerKeyStore';

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
    type: 'ledger',
    id: {
      network: 'test',
      address: 'ARL4VYQWxSwigpRsCsucLxovujKDmwYeTd',
    },
    name: '0',
    publicKey: '03d81d462f80d55ff234b1b221e46d52e4da3f93c465edbbaeebd742bc1947fe6d',
    configurableName: false,
    deletable: false,
  };

  const secondaryAccount = {
    type: 'ledger',
    id: {
      network: 'test',
      address: 'AJGCVgoLp3bU57zd4k6mcpedWr45Em8dFD',
    },
    name: '1',
    publicKey: '031546889cf12577237536380e86b2587d55743f9d4dac8879f332b79ce1a84cd6',
    configurableName: false,
    deletable: false,
  };

  const indexLedger: Ledger = {
    accountKey: 0,
    account: indexAccount,
  };

  const secondaryLedger: Ledger = {
    accountKey: 1,
    account: secondaryAccount,
  };

  let keystore: LedgerKeyStore;

  beforeEach(() => {
    getAccount.mockReset();
    getAccount.mockImplementation(() => emptyAccount);
    keystore = new LedgerKeyStore(ledgerProvider);
  });

  afterEach(() => {
    keystore.close().catch(() => {
      // do nothing
    });
  });

  test('type', () => {
    const result = keystore.type;

    expect(result).toEqual('ledger');
  });

  test('currentAccount$', async () => {
    const result = await keystore.currentAccount$
      .pipe(
        filter((value) => value !== undefined),
        take(1),
      )
      .toPromise();

    expect(result).toEqual(indexAccount);
  });

  test('accounts$', async () => {
    const result = await keystore.accounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();

    expect(result).toEqual([indexAccount, secondaryAccount]);
  });

  test('getAccounts', async () => {
    await keystore.accounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();
    const result = keystore.getAccounts();

    expect(result).toEqual([indexAccount, secondaryAccount]);
  });

  test('ledgers', async () => {
    await keystore.accounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();
    const result = keystore.ledgers;

    expect(flattenLedgers(result)).toEqual([indexLedger, secondaryLedger]);
  });

  test('mixed scan', async () => {
    let count = 0;
    getAccount.mockReset();
    getAccount.mockImplementation(() => {
      if (count === 19) {
        count += 1;

        return activeAccount;
      }
      count += 1;

      return emptyAccount;
    });

    await keystore.close();

    keystore = new LedgerKeyStore(ledgerProvider);
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
