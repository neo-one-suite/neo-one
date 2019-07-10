import { Observable, of } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { getLedgerAccounts } from '../../../__data__/';
import { UnknownAccountError, UnknownNetworkError } from '../../../errors';
import { HDAccount, HDHandler, HDKeyStore } from '../../../user/keystore';

interface BootstrapOptions {
  readonly networks: readonly string[];
  readonly byteLimit: number | undefined;
  readonly scanAccounts: (network: string) => ReadonlyArray<HDAccount<number>>;
}

const testLedgerAccounts = getLedgerAccounts('test');
const mainLedgerAccounts = getLedgerAccounts('main');

const getScanAccountsTest = (endIndex: number) => (_network: string) => testLedgerAccounts.slice(0, endIndex);
const getScanAccountsMain = (endIndex: number) => (_network: string) => mainLedgerAccounts.slice(0, endIndex);

const mixedScanAccounts = (endIndex: number) => (network: string) => {
  if (network === 'test') {
    return getScanAccountsTest(endIndex)('test');
  }
  if (network === 'main') {
    return getScanAccountsMain(endIndex)('main');
  }
  throw new Error('what');
};

describe('LedgerKeyStore', () => {
  const scanAccounts = jest.fn();
  const sign = jest.fn();
  const close = jest.fn();

  const getNetworks = jest.fn();
  const getAccount = jest.fn();

  const handler: HDHandler<number> = {
    byteLimit: 256,
    scanAccounts,
    sign,
    close,
  };

  let networks$: Observable<readonly string[]>;
  let keystore: HDKeyStore<number>;

  const bootstrapKeystore = (options: Partial<BootstrapOptions> = {}) => {
    const networks = options.networks !== undefined ? options.networks : ['test'];
    const mockScan = options.scanAccounts !== undefined ? options.scanAccounts : getScanAccountsTest(2);
    networks$ = of(networks);
    getNetworks.mockImplementation(() => networks);
    scanAccounts.mockImplementation(mockScan);
    sign.mockImplementation(() => 'response');
    keystore = new HDKeyStore({ networks$, getNetworks, getAccount }, handler);
  };

  beforeEach(() => {
    getNetworks.mockReset();
    scanAccounts.mockReset();
    sign.mockReset();
    close.mockReset();
  });

  test('currentUserAccount$', async () => {
    bootstrapKeystore();
    const currentUserAccount = await keystore.currentUserAccount$
      .pipe(
        filter((value) => value !== undefined),
        take(1),
      )
      .toPromise();

    if (currentUserAccount === undefined) {
      throw new Error('For TS');
    }
    expect(currentUserAccount).toEqual(testLedgerAccounts[0].userAccount);
  });

  test('account$', async () => {
    bootstrapKeystore();
    const accounts = await keystore.userAccounts$
      .pipe(
        filter((value) => value.length > 0),
        take(1),
      )
      .toPromise();

    expect(accounts).toEqual(testLedgerAccounts.slice(0, 2).map(({ userAccount }) => userAccount));
  });

  test('byteLimit', () => {
    bootstrapKeystore();
    const result = keystore.byteLimit;

    expect(result).toEqual(256);
  });

  test('getNetworks', () => {
    bootstrapKeystore();
    const result = keystore.getNetworks();

    expect(result).toEqual(['test']);
  });

  test('selectUserAccount - currentUserAccount', async () => {
    bootstrapKeystore();
    await keystore.currentUserAccount$
      .pipe(
        filter((value) => value !== undefined),
        take(1),
      )
      .toPromise();

    expect(keystore.getCurrentUserAccount()).toEqual(testLedgerAccounts[0].userAccount);
    await keystore.selectUserAccount();
    expect(keystore.getCurrentUserAccount()).toEqual(undefined);
    await keystore.selectUserAccount(testLedgerAccounts[0].userAccount.id);
    expect(keystore.getCurrentUserAccount()).toEqual(testLedgerAccounts[0].userAccount);
  });

  test('selectUserAccount - throws on bad network', async () => {
    bootstrapKeystore();
    await keystore.userAccounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();
    const badNetwork = 'badNetwork';
    const getLedgersThrow = keystore.selectUserAccount({
      address: testLedgerAccounts[0].userAccount.id.address,
      network: badNetwork,
    });

    await expect(getLedgersThrow).rejects.toEqual(new UnknownNetworkError(badNetwork));
  });

  test('selectUserAccount - throws on bad address', async () => {
    bootstrapKeystore();
    await keystore.userAccounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();
    const badAddress = 'badAddress';
    const getLedgersThrow = keystore.selectUserAccount({
      address: badAddress,
      network: testLedgerAccounts[0].userAccount.id.network,
    });

    await expect(getLedgersThrow).rejects.toEqual(new UnknownAccountError(badAddress));
  });

  test('getUserAccounts', async () => {
    bootstrapKeystore({
      networks: ['test', 'main'],
      scanAccounts: mixedScanAccounts(2),
    });

    await keystore.currentUserAccount$
      .pipe(
        filter((value) => value !== undefined),
        take(1),
      )
      .toPromise();

    const result = keystore.getUserAccounts();

    expect(result).toEqual([
      testLedgerAccounts[0].userAccount,
      testLedgerAccounts[1].userAccount,
      mainLedgerAccounts[0].userAccount,
      mainLedgerAccounts[1].userAccount,
    ]);
  });

  test('sign', async () => {
    bootstrapKeystore();
    await keystore.userAccounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();

    await keystore.sign({ account: testLedgerAccounts[0].userAccount.id, message: 'test' });

    expect(sign).toBeCalledTimes(1);
  });

  test('close', async () => {
    bootstrapKeystore();
    await keystore.close();

    expect(close).toBeCalledTimes(1);
  });
});
