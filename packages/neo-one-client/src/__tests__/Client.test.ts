import BigNumber from 'bignumber.js';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import * as argAssertions from '../args';
import { Client } from '../Client';
import { InvalidArgumentError, UnknownNetworkError } from '../errors';
import { createSmartContract } from '../sc/createSmartContract';
import { UserAccountProvider } from '../types';

jest.mock('../sc/createSmartContract');

describe('Client', () => {
  const id1 = { network: 'net1', address: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR' };
  const id2 = { network: 'net2', address: 'Aew1QakLBrMqn9pmYpVrgwKPXCqTfzd6sZ' };
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
  const provider1: UserAccountProvider = {
    type: 'test1',
    currentAccount$: of(account1),
    accounts$: of([account1]),
    networks$: of(['net1']),
    getCurrentAccount: () => account1,
    getAccounts: () => [account1],
    getNetworks: () => [network1],
    deleteAccount: () => [],
    updateAccountName: () => [],
    read: () => [],
  } as any;

  const provider2: UserAccountProvider = {
    type: 'test2',
    currentAccount$: of(account2),
    accounts$: of([account2]),
    networks$: of(['net2']),
    getCurrentAccount: () => account2,
    getAccounts: () => [account2],
    getNetworks: () => [network2],
    deleteAccount: () => [],
    updateAccountName: () => [],
    read: () => [],
  } as any;

  let client = new Client({ test1: provider1, test2: provider2 } as any);
  beforeEach(() => {
    client = new Client({ test1: provider1, test2: provider2 } as any);
  });

  test('Client constructor throws error on undefined client', () => {
    function testError() {
      client = new Client({});
    }

    expect(testError).toThrow(new Error('At least one provider is required') as any);
  });

  test('Client constructor throws error on mismatched provider type', () => {
    function testError() {
      client = new Client({
        test: {
          type: 'invalid',
          getCurrentAccount: () => {
            // do nothing
          },
        } as any,
      });
    }

    expect(testError).toThrow(new Error('Provider keys must be named the same as their type') as any);
  });

  test('Client constructor sets up currentAcount$ observable', async () => {
    const result = await client.currentAccount$.pipe(take(1)).toPromise();
    expect(result).toEqual(account1);
  });

  test('Client constructor sets up accounts$ observable', async () => {
    const result = await client.accounts$.pipe(take(1)).toPromise();
    expect(result).toEqual([account1, account2]);
  });

  test('Client constructor sets up networks$ observable', async () => {
    const result = await client.networks$.pipe(take(1)).toPromise();
    expect(result).toEqual(['net1', 'net2']);
  });

  test('get providers', async () => {
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
      new InvalidArgumentError(`Invalid argument for UserAccountID: Error: Invalid address: ${accountID.address}`),
    );
  });

  test('selectAccount', async () => {
    (provider2 as any).selectAccount = jest.fn(() => Promise.resolve());

    expect(client.getCurrentAccount()).toEqual(account1);
    await client.selectAccount(id2);
    expect(client.getCurrentAccount()).toEqual(account2);
  });

  test('getAccounts', () => {
    const expected = [account1, account2];

    const result = client.getAccounts();
    expect(result).toEqual(expected);
  });

  test('getAccount', () => {
    const expected = account1;

    const result = client.getAccount(id1);
    expect(result).toEqual(expected);
  });

  test('getAccount throws error on nonexistant account', () => {
    const idFake = { network: 'fakeNet', address: 'fakeAddr' };

    function testError() {
      return client.getAccount(idFake);
    }
    expect(testError).toThrow(new InvalidArgumentError(
      `Invalid argument for UserAccountID: Error: Invalid address: ${idFake.address}`,
    ) as any);
  });

  test('deleteAccount', async () => {
    const mocked = jest.fn(() => Promise.resolve());
    (provider2 as any).deleteAccount = mocked;

    await client.deleteAccount(id2);
    expect(mocked.mock.calls).toMatchSnapshot();
  });

  test('updateAccountName', async () => {
    const mocked = jest.fn(() => Promise.resolve());
    (provider2 as any).updateAccountName = mocked;

    await client.updateAccountName({ id: id2, name: 'newName' });
    expect(mocked.mock.calls).toMatchSnapshot();
  });

  test('getNetworks', () => {
    const expected = [network1, network2];

    const result = client.getNetworks();
    expect(result).toEqual(expected);
  });

  test('read', () => {
    const mocked = jest.fn(() => {
      // do nothing
    });
    (provider1 as any).read = mocked;

    const result = client.read('net1');
    expect(result).toMatchSnapshot();
    expect(mocked.mock.calls).toMatchSnapshot();
  });

  test('read throws error on invalid network', () => {
    function testError() {
      return client.read('fakeNet');
    }
    expect(testError).toThrow(new UnknownNetworkError('fakeNet') as any);
  });

  test('inject', () => {
    client = new Client({ test1: provider1 } as any);

    expect(client.getCurrentAccount()).toEqual(account1);
    expect(client.providers).toEqual({ test1: provider1 });
    // any
    client.inject(provider2);

    expect(client.getCurrentAccount()).toEqual(account2);
    expect(client.providers).toEqual({
      test1: provider1,
      test2: provider2,
    });
  });

  test('static inject', () => {
    client = new Client({ test1: provider1 } as any);

    expect(client.getCurrentAccount()).toEqual(account1);
    expect(client.providers).toEqual({ test1: provider1 });
    // any
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
      args: [
        [
          {
            amount: new BigNumber(10),
            asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
            to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          },
        ],
        undefined,
      ],
    },

    {
      method: 'transfer',
      args: [
        [
          {
            amount: new BigNumber(10),
            asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
            to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          },
        ],
      ],
    },

    {
      method: 'claim',
      args: [],
    },

    {
      method: 'publish',
      args: [
        {
          script: '02028a99826e',
          parameters: ['Signature'],
          returnType: 'Signature',
          name: 'contract',
          codeVersion: 'codeVersion',
          author: 'author',
          email: 'email',
          description: 'description',
          properties: {
            storage: true,
            dynamicInvoke: true,
            payable: true,
          },
        },
      ],
    },

    {
      method: 'registerAsset',
      args: [
        {
          assetType: 'CreditFlag',
          name: 'asset',
          amount: new BigNumber(10),
          precision: 20,
          owner: '02028a99826edc0c97d18e22b6932373d908d323aa7f92656a77ec26e8861699ef',
          admin: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          issuer: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
        },
      ],
    },

    {
      method: 'issue',
      args: [
        [
          {
            amount: new BigNumber(10),
            asset: '0x7f48028c38117ac9e42c8e1f6f06ae027cdbb904eaf1a0bdc30c9d81694e045c',
            to: 'APyEx5f4Zm4oCHwFWiSTaph1fPBxZacYVR',
          },
        ],
        undefined,
      ],
    },

    {
      method: '__invoke',
      args: ['0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9', 1, 2, 3, true],
      providerMethod: 'invoke',
    },

    {
      method: '__call',
      args: ['0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9', 1, 2],
      providerMethod: 'call',
    },
  ];

  for (const testCase of testCases) {
    const { method, args } = testCase;
    const expected = '10';

    let providerMethod = method;
    if (testCase.providerMethod != undefined) {
      providerMethod = testCase.providerMethod;
    }
    test(method, async () => {
      (provider1 as any)[providerMethod] = jest.fn(() => Promise.resolve(expected));

      if (method === 'claim' || method === 'publish') {
        (argAssertions as any).assertTransactionOptions = jest.fn(() => true);
      }
      const result = await (client as any)[method](...args);
      expect(result).toEqual(expected);
    });
  }

  test('smartContract', () => {
    const expected = {
      networks: {
        main: {
          hash: '0xecc6b20d3ccac1ee9ef109af5a7cdb85706b1df9',
        },
      },
      abi: {
        functions: [],
      },
    };
    (createSmartContract as any).mockImplementation(() => expected);
    const result = client.smartContract(expected as any);
    expect(result).toEqual(expected);
  });
});
