/* @flow */
import NEOONEProvider from '../../../provider/neoone/NEOONEProvider';
import { UnknownNetworkError } from '../../../errors';

import { keys, transactions } from '../../../__data__';
import * as networkConfigs from '../../../networks';

describe('NEOONEProvider', () => {
  const network = 'net';
  const expected = '0';
  const mainRPCURL = 'foo';
  const testRPCURL = 'bar';
  const options = [{ network, rpcURL: 'rpc' }];

  let provider = new NEOONEProvider({ mainRPCURL, testRPCURL, options });
  beforeEach(() => {
    provider = new NEOONEProvider({ mainRPCURL, testRPCURL, options });
  });

  test('NEOONEProvider constructor with no options', async () => {
    const testProvider = new NEOONEProvider();
    const result = await testProvider.getNetworks();
    expect(result).toEqual(['main', 'test']);
  });

  test('NEOONEProvider constructor with main & test', async () => {
    const testOptions = [
      { network: networkConfigs.MAIN, rpcURL: networkConfigs.MAIN_URL },
      { network: networkConfigs.TEST, rpcURL: networkConfigs.TEST_URL },
    ];
    const testExpected = testOptions.map(option => option.network);

    // $FlowFixMe
    const testProvider = new NEOONEProvider({ options: testOptions });
    const result = await testProvider.getNetworks();
    expect(result).toEqual(testExpected);
  });

  test('getNetworks', async () => {
    // $FlowFixMe
    provider._networks$.getValue = jest.fn(() => '0');

    const result = provider.getNetworks();
    expect(result).toEqual(expected);
  });

  test('addNetwork new network', async () => {
    const newNetwork = 'newNet';
    provider.addNetwork({ network: newNetwork, rpcURL: 'rpc' });

    const result = await provider.getNetworks();
    expect(result).toEqual([network, 'main', 'test', newNetwork]);
  });

  test('addNetwork existing network', async () => {
    provider.addNetwork({ network, rpcURL: 'rpc' });

    const result = await provider.getNetworks();
    expect(result).toEqual(['main', 'test', network]);
  });

  test('read', () => {
    const result = provider.read(network);
    expect(result).toMatchSnapshot();
  });

  test('_getProvider throws error for unknown network', () => {
    const fakeNet = 'fake';
    function testError() {
      // $FlowFixMe
      provider._getProvider(fakeNet);
    }
    expect(testError).toThrow(new UnknownNetworkError(fakeNet));
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
      // $FlowFixMe
      provider._providers[network][method] = jest.fn(() => expected);
      // $FlowFixMe
      const result = await provider[method](...args);
      expect(result).toEqual(expected);
    });
  }
});
