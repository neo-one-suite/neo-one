import { Account, AddressString, NetworkType, publicKeyToAddress } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { addHDKeysToCrypto, seedOne } from '../../../__data__';
import { HDLocalStore, LocalHDHandler, LocalPath } from '../../../user';

const emptyAccount = {
  balances: {
    ['ONE']: new BigNumber(0),
  },
};

const activeAccount = {
  balances: {
    ['ONE']: new BigNumber(1),
  },
};

const info = Object(seedOne.info);
const getPublicKeyMock = (path: LocalPath): string => {
  const data = info[`m/${path.join('/')}`];
  if (data === undefined) {
    throw new Error(`what did it try? ${path}`);
  }

  return data.publicKeyString;
};

const getAccountMock = (activePath: LocalPath) => {
  const activeAddress = publicKeyToAddress(getPublicKeyMock(activePath));

  return async (_network: NetworkType, address: AddressString) => {
    if (address === activeAddress) {
      return Promise.resolve({
        address,
        ...activeAccount,
      });
    }

    return Promise.resolve({ address, ...emptyAccount });
  };
};

describe('LocalHDHandler', () => {
  addHDKeysToCrypto();
  const network = 'local';

  const getAccount = jest.fn();

  const getPublicKey = jest.fn();
  const getMasterPath = jest.fn();
  const sign = jest.fn();
  const close = jest.fn();

  const store: HDLocalStore = {
    getMasterPath,
    getPublicKey,
    sign,
    close,
  };

  let handler: LocalHDHandler;
  beforeEach(() => {
    getAccount.mockReset();
    getMasterPath.mockReset();
    getPublicKey.mockReset();
    sign.mockReset();
    close.mockReset();
  });

  const bootstrapMockHandler = (
    masterPath: readonly number[],
    getAccountMockIn?: (network: NetworkType, address: AddressString) => Promise<Account>,
  ) => {
    getMasterPath.mockImplementation(() => masterPath);
    getPublicKey.mockImplementation(getPublicKeyMock);
    getAccount.mockImplementation(getAccountMockIn !== undefined ? getAccountMockIn : () => emptyAccount);
    handler = new LocalHDHandler(getAccount, store);
  };

  test('Chain Access Discovery', async () => {
    bootstrapMockHandler([0, 0]);
    const accounts = await handler.scanAccounts(network, 5);

    expect(accounts.length).toEqual(2);
    expect(accounts).toMatchSnapshot();
  });

  test('Wallet Access Discovery', async () => {
    bootstrapMockHandler([0]);
    const accounts = await handler.scanAccounts(network, 5);

    expect(accounts.length).toEqual(4);
    expect(accounts).toMatchSnapshot();
  });

  test('Master Access Discovery', async () => {
    bootstrapMockHandler([]);
    const accounts = await handler.scanAccounts(network, 4);

    expect(accounts.length).toEqual(8);
    expect(accounts).toMatchSnapshot();
  });

  test('Chain Access Discovery - active account', async () => {
    bootstrapMockHandler([0, 0], getAccountMock([0, 0, 1] as const));
    const accounts = await handler.scanAccounts(network, 5);

    expect(accounts.length).toEqual(3);
    expect(accounts).toMatchSnapshot();
  });

  test('Wallet Access Discovery - active account', async () => {
    bootstrapMockHandler([0], getAccountMock([0, 0, 1] as const));
    const accounts = await handler.scanAccounts(network, 5);

    expect(accounts.length).toEqual(5);
    expect(accounts).toMatchSnapshot();
  });

  test('Master Access Discovery - active account', async () => {
    bootstrapMockHandler([], getAccountMock([1, 0, 1] as const));
    const accounts = await handler.scanAccounts(network, 4);

    expect(accounts.length).toEqual(13);
    expect(accounts).toMatchSnapshot();
  });
});
