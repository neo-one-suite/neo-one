import { DefaultMonitor } from '@neo-one/monitor';
import { Observable, of } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { getLocalHDAccounts } from '../../../__data__';
import { UnknownAccountError, UnknownNetworkError } from '../../../errors';
import { HDAccount, HDHandler, HDKeyStore, LocalPath } from '../../../user/';

interface BootstrapOptions {
  readonly networks: readonly string[];
  readonly scanAccounts: (network: string) => ReadonlyArray<HDAccount<LocalPath>>;
}

const testHDAccounts = getLocalHDAccounts('test');
const mainHDAccounts = getLocalHDAccounts('main');

const scanAccountsTest = (_network: string) => testHDAccounts;

const mixedScanAccounts = (network: string) => {
  if (network === 'test') {
    return testHDAccounts;
  }
  if (network === 'main') {
    return mainHDAccounts;
  }
  throw new Error('what');
};

describe('HDKeyStore', () => {
  const scanAccounts = jest.fn();
  const sign = jest.fn();
  const close = jest.fn();

  const getNetworks = jest.fn();
  const getAccount = jest.fn();

  const handler: HDHandler<LocalPath> = {
    scanAccounts,
    sign,
    close,
  };

  let networks$: Observable<readonly string[]>;
  let keystore: HDKeyStore<LocalPath>;

  const bootstrapKeystore = (options: Partial<BootstrapOptions> = {}) => {
    const networks = options.networks !== undefined ? options.networks : ['test'];
    const mockScan = options.scanAccounts !== undefined ? options.scanAccounts : scanAccountsTest;
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
    expect(currentUserAccount).toEqual(testHDAccounts[0].userAccount);
  });

  test('account$', async () => {
    bootstrapKeystore();
    const accounts = await keystore.userAccounts$
      .pipe(
        filter((value) => value.length > 0),
        take(1),
      )
      .toPromise();
    expect(accounts).toEqual(testHDAccounts.map(({ userAccount }) => userAccount));
  });

  test('byteLimit', () => {
    bootstrapKeystore();
    const result = keystore.byteLimit;

    expect(result).toBeUndefined();
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

    expect(keystore.getCurrentUserAccount()).toEqual(testHDAccounts[0].userAccount);
    await keystore.selectUserAccount();
    expect(keystore.getCurrentUserAccount()).toEqual(undefined);
    await keystore.selectUserAccount(testHDAccounts[0].userAccount.id);
    expect(keystore.getCurrentUserAccount()).toEqual(testHDAccounts[0].userAccount);
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
      address: testHDAccounts[0].userAccount.id.address,
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
      network: testHDAccounts[0].userAccount.id.network,
    });

    await expect(getLedgersThrow).rejects.toEqual(new UnknownAccountError(badAddress));
  });

  test('getUserAccounts - single', async () => {
    bootstrapKeystore();

    await keystore.currentUserAccount$
      .pipe(
        filter((value) => value !== undefined),
        take(1),
      )
      .toPromise();

    const result = keystore.getUserAccounts();

    expect(result).toEqual(testHDAccounts.map(({ userAccount }) => userAccount));
  });

  test('getUserAccounts - mixed scan', async () => {
    bootstrapKeystore({
      networks: ['test', 'main'],
      scanAccounts: mixedScanAccounts,
    });

    await keystore.currentUserAccount$
      .pipe(
        filter((value) => value !== undefined),
        take(1),
      )
      .toPromise();

    const result = keystore.getUserAccounts();

    expect(result).toEqual(testHDAccounts.concat(mainHDAccounts).map(({ userAccount }) => userAccount));
  });

  test('sign', async () => {
    bootstrapKeystore();
    await keystore.userAccounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();

    await keystore.sign({ account: testHDAccounts[0].userAccount.id, message: 'test' });

    expect(sign).toBeCalledTimes(1);
  });

  test('sign - with monitor', async () => {
    bootstrapKeystore();
    const monitor = DefaultMonitor.create({ service: 'test' });
    await keystore.userAccounts$
      .pipe(
        filter((value) => value.length !== 0),
        take(1),
      )
      .toPromise();

    await keystore.sign({ account: testHDAccounts[0].userAccount.id, message: 'test', monitor });

    expect(sign).toBeCalledTimes(1);
  });

  test('close', async () => {
    bootstrapKeystore();
    await keystore.close();

    expect(close).toBeCalledTimes(1);
  });
});
