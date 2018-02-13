/* @flow */
import Client from '../Client';
import * as argAssertions from '../args';
import { UnknownAccountError } from '../errors';
import { transactions } from '../__data__';
import createSmartContract from '../sc/createSmartContract';

jest.mock('../sc/createSmartContract');

describe('Client', () => {
  const id1 = { network: 'net1', address: 'addr1' };
  const id2 = { network: 'net2', address: 'addr2' };
  const account1 = {
    type: 'test1',
    id: id1,
    name: 'account1',
    scriptHash: 'hash160-1',
    publicKey: 'pukey-1',
  };
  const account2 = {
    type: 'test2',
    id: id2,
    name: 'account2',
    scriptHash: 'hash160-2',
    publicKey: 'pubkey-2',
  };
  const network1 = 'net1';
  const network2 = 'net2';
  const provider1 = {
    type: 'test1',
    currentAcount$: account1,
    getCurrentAccount: () => account1,
    getAccounts: () => [account1],
    getNetworks: () => [network1],
  };
  const provider2 = {
    type: 'test2',
    currentAccount$: account2,
    getCurrentAccount: () => account2,
    getAccounts: () => [account2],
    getNetworks: () => [network2],
  };

  let client = new Client(({ test1: provider1, test2: provider2 }: $FlowFixMe));
  beforeEach(() => {
    client = new Client(({ test1: provider1, test2: provider2 }: $FlowFixMe));
  });

  test('Client constructor throws error on null client', () => {
    function testError() {
      client = new Client({});
    }

    expect(testError).toThrow(new Error('At least one provider is required'));
  });

  test('Client constructor throws error on mismatched provider type', () => {
    function testError() {
      client = new Client({ test: { type: 'invalid' } });
    }

    expect(testError).toThrow(
      new Error('Provider keys must be named the same as their type'),
    );
  });

  test('get providers', () => {
    const result = client.providers;
    expect(result).toEqual({
      test1: provider1,
      test2: provider2,
    });
  });

  test('selectAccount throws error on unknown account', async () => {
    const accountID = { network: 'fakeNet', address: 'fakeAddr' };

    const result = client.selectAccount(accountID);

    await expect(result).rejects.toEqual(
      new UnknownAccountError(accountID.address),
    );
  });

  test('selectAccount', async () => {
    // $FlowFixMe
    provider2.selectAccount = jest.fn(() => Promise.resolve());

    expect(client.getCurrentAccount()).toEqual(account1);
    await client.selectAccount(id2);
    expect(client.getCurrentAccount()).toEqual(account2);
  });

  test('getAccounts', () => {
    const expected = [account1, account2];

    const result = client.getAccounts();
    expect(result).toEqual(expected);
  });

  test('getNetworks', () => {
    const expected = [network1, network2];

    const result = client.getNetworks();
    expect(result).toEqual(expected);
  });

  test('inject', () => {
    client = new Client(({ test1: provider1 }: $FlowFixMe));

    expect(client.getCurrentAccount()).toEqual(account1);
    expect(client.providers).toEqual({ test1: provider1 });
    // $FlowFixMe
    client.inject(provider2);

    expect(client.getCurrentAccount()).toEqual(account2);
    expect(client.providers).toEqual({
      test1: provider1,
      test2: provider2,
    });
  });

  test('static inject', () => {
    client = new Client(({ test1: provider1 }: $FlowFixMe));

    expect(client.getCurrentAccount()).toEqual(account1);
    expect(client.providers).toEqual({ test1: provider1 });
    // $FlowFixMe
    Client.inject(provider2);

    expect(client.getCurrentAccount()).toEqual(account2);
    expect(client.providers).toEqual({
      test1: provider1,
      test2: provider2,
    });
  });

  const testCases = [
    {
      method: 'getCurrentAccount',
      args: [],
    },
    {
      method: 'transfer',
      args: [0, 1],
    },
    {
      method: 'transfer',
      args: [0, 1, 2],
    },
    {
      method: 'claim',
      args: [],
    },
    {
      method: 'publish',
      args: ['contract'],
    },
    {
      method: 'registerAsset',
      args: [transactions.register.asset],
    },
    {
      method: 'issue',
      args: [0, 1],
      providerMethod: 'transfer',
    },
    {
      method: '_invoke',
      args: [0, 1, 2, 3, 4],
      providerMethod: 'invoke',
    },
    {
      method: '_call',
      args: [0, 1, 2],
      providerMethod: 'call',
    },
  ];

  for (const testCase of testCases) {
    const { method, args } = testCase;
    const expected = '10';

    let providerMethod = method;
    if (testCase.providerMethod != null) {
      ({ providerMethod } = testCase);
    }
    // eslint-disable-next-line
    test(method, async () => {
      provider1[(providerMethod: $FlowFixMe)] = jest.fn(() =>
        Promise.resolve(expected),
      );
      if (method === 'claim' || method === 'publish') {
        // $FlowFixMe
        argAssertions.assertTransactionOptions = jest.fn(() => true);
      }
      // $FlowFixMe
      const result = await client[method](...args);
      expect(result).toEqual(expected);
    });
  }

  test('smartContract', () => {
    const expected = '10';
    // $FlowFixMe
    createSmartContract.mockImplementation(() => expected);
    const result = client.smartContract((expected: $FlowFixMe));
    expect(result).toEqual(expected);
  });
});
