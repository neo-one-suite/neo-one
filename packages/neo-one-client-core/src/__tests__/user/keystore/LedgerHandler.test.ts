import { AddressString, NetworkType, publicKeyToAddress } from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { ledgerKeys } from '../../../__data__';
import { ConnectedLedgerStore, LedgerHandler, LedgerStore } from '../../../user/keystore/';

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

const info = Object(ledgerKeys);
const getPublicKeyMock = (index: number): string => {
  const data = info[index.toString()];
  if (data === undefined) {
    throw new Error(`what did it try to get? ${index}`);
  }

  return data;
};

const getAccountMock = (index: number) => {
  const activeAddress = publicKeyToAddress(getPublicKeyMock(index));

  return (_network: NetworkType, address: AddressString, _monitor?: Monitor) => {
    if (address === activeAddress) {
      return activeAccount;
    }

    return emptyAccount;
  };
};
describe('LedgerHandler', () => {
  const network = 'test';
  const getAccount = jest.fn();

  const getPublicKey = jest.fn();
  const sign = jest.fn();
  const close = jest.fn();

  const connectedStore: ConnectedLedgerStore = {
    getPublicKey,
    sign,
    close,
  };

  const byteLimit = 256;
  const type = 'mock';

  const store: LedgerStore = {
    init: () => Promise.resolve(connectedStore),
    byteLimit,
    type,
  };

  let handler: LedgerHandler;

  beforeEach(() => {
    getAccount.mockReset();
    getPublicKey.mockReset();
    sign.mockReset();
    close.mockReset();
    getPublicKey.mockImplementation(getPublicKeyMock);
    getAccount.mockImplementation(() => emptyAccount);
    handler = new LedgerHandler({
      getAccount,
      store,
    });
  });

  test('Properties - byteLimit', () => {
    expect(handler.byteLimit).toEqual(byteLimit);
  });

  test('Properties - type', () => {
    expect(handler.type).toEqual(type);
  });

  test('Ledger Discovery - Empty', async () => {
    const accounts = await handler.scanAccounts(network);

    expect(accounts.length).toEqual(2);
    expect(accounts).toMatchSnapshot();
  });

  test('Ledger Discovery - Account at index 5', async () => {
    getAccount.mockReset();
    getAccount.mockImplementation(getAccountMock(5));

    const accounts = await handler.scanAccounts(network);

    expect(accounts.length).toEqual(7);
    expect(accounts).toMatchSnapshot();
  });

  test('LedgerStore Wrappers - sign', async () => {
    await handler.sign({
      message: Buffer.from('1234', 'hex'),
      account: 5,
    });

    expect(sign).toBeCalledTimes(1);
  });

  test('LedgerStore Wrappers - close', async () => {
    await handler.close();

    expect(close).toBeCalledTimes(1);
  });
});
