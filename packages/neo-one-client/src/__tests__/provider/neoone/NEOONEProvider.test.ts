import { keys, transactions } from '../../../__data__';
import { UnknownNetworkError } from '../../../errors';
import * as networkConfigs from '../../../networks';
import { NEOONEProvider } from '../../../provider/neoone/NEOONEProvider';

const MAIN_URL = 'https://neotracker.io/rpc';

describe('NEOONEProvider', () => {
  const network = 'net';
  const expected = '0';
  const options = [{ network, rpcURL: 'rpc' }];

  let provider = new NEOONEProvider(options);
  beforeEach(() => {
    provider = new NEOONEProvider(options);
  });

  test('NEOONEProvider constructor with no options', async () => {
    const testProvider = new NEOONEProvider();
    const result = await testProvider.getNetworks();
    expect(result).toEqual([]);
  });

  test('NEOONEProvider constructor with main & test', async () => {
    const testOptions = [{ network: networkConfigs.MAIN, rpcURL: MAIN_URL }];

    const testExpected = testOptions.map((option) => option.network);

    const testProvider = new NEOONEProvider(testOptions);
    const result = await testProvider.getNetworks();
    expect(result).toEqual(testExpected);
  });

  test('getNetworks', async () => {
    // @ts-ignore
    provider.networks$.getValue = jest.fn(() => '0');

    const result = provider.getNetworks();
    expect(result).toEqual(expected);
  });

  test('addNetwork new network', async () => {
    const newNetwork = 'newNet';
    provider.addNetwork({ network: newNetwork, rpcURL: 'rpc' });

    const result = await provider.getNetworks();
    expect(result).toEqual([network, newNetwork]);
  });

  test('addNetwork existing network', async () => {
    provider.addNetwork({ network, rpcURL: 'rpc' });

    const result = await provider.getNetworks();
    expect(result).toEqual([network]);

    provider.addNetwork({ network, rpcURL: 'rpc' });
    const newResult = await provider.getNetworks();
    expect(newResult).toEqual([network]);
  });

  test('read', () => {
    const result = provider.read(network);
    expect(result).toMatchSnapshot();
  });

  test('_getProvider throws error for unknown network', () => {
    const fakeNet = 'fake';
    function testError() {
      // @ts-ignore
      provider.getProvider(fakeNet);
    }
    expect(testError).toThrow(new UnknownNetworkError(fakeNet) as any);
  });

  const testCases = [
    {
      method: 'getUnclaimed',
      args: [network, keys[0].address],
    },

    {
      method: 'getUnspentOutputs',
      args: [network, keys[0].address],
    },

    {
      method: 'relayTransaction',
      args: [network, ''],
    },

    {
      method: 'getTransactionReceipt',
      args: [network, transactions.register.hash],
    },

    {
      method: 'getInvocationData',
      args: [network, transactions.register.hash],
    },

    {
      method: 'testInvoke',
      args: [network, ''],
    },

    {
      method: 'getNetworkSettings',
      args: [network],
    },
  ];

  for (const testCase of testCases) {
    const { method, args } = testCase;
    // eslint-disable-next-line
    test(method, async () => {
      // @ts-ignore
      provider.mutableProviders[network][method] = jest.fn(() => expected);
      // @ts-ignore
      const result = await provider[method](...args);
      expect(result).toEqual(expected);
    });
  }
});
