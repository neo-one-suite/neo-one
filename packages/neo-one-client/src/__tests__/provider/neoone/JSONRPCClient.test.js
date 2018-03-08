/* @flow */
import BigNumber from 'bignumber.js';

import { keys, transactions } from '../../../__data__';

import JSONRPCClient from '../../../provider/neoone/JSONRPCClient';
import { RelayTransactionError } from '../../../errors';
import { JSONRPCError } from '../../../provider/neoone/errors';

describe('JSONRPCClient', () => {
  const expected = '10';
  const jsonProvider = { request: jest.fn(() => Promise.resolve(expected)) };
  const provider = new JSONRPCClient(jsonProvider);
  const testCases = [
    {
      method: 'getAccount',
      args: [keys[0].address],
    },
    {
      method: 'getAsset',
      args: [transactions.register.hash],
    },
    {
      method: 'getBlock',
      args: [transactions.register.hash],
    },
    {
      method: 'getBlock',
      args: [0],
    },
    {
      method: 'getBlock',
      args: [0, { timeoutMS: 1000 }],
    },
    {
      method: 'getBestBlockHash',
      args: [],
    },
    {
      method: 'getBlockCount',
      args: [],
    },
    {
      method: 'getContract',
      args: [keys[0].scriptHash],
    },
    {
      method: 'getMemPool',
      args: [],
    },
    {
      method: 'getTransaction',
      args: [transactions.register.hash],
    },
    {
      method: 'getStorageItem',
      args: [keys[0].scriptHash, '123'],
      result: { hash: keys[0].scriptHash, key: '123', value: expected },
    },
    {
      method: 'getUnspentOutput',
      args: [
        {
          hash: transactions.register.hash,
          index: 0,
        },
      ],
    },
    {
      method: 'testInvokeRaw',
      args: [Buffer.from('123', 'hex')],
    },
    {
      method: 'sendTransactionRaw',
      args: [''],
    },
    {
      method: 'relayTransaction',
      args: [''],
    },
    {
      method: 'getOutput',
      args: [
        {
          hash: transactions.register.hash,
          index: 0,
        },
      ],
    },
    {
      method: 'getClaimAmount',
      args: [
        {
          hash: transactions.register.hash,
          index: 0,
        },
      ],
      result: new BigNumber(expected),
    },
    {
      method: 'getAllStorage',
      args: [keys[0].scriptHash],
    },
    {
      method: 'testInvocation',
      args: [Buffer.alloc(1, 0)],
    },
    {
      method: 'getTransactionReceipt',
      args: [keys[0].scriptHash],
    },
    {
      method: 'getTransactionReceipt',
      args: [keys[0].scriptHash, { timeoutMS: 1000 }],
    },
    {
      method: 'getInvocationData',
      args: [keys[0].scriptHash],
    },
    {
      method: 'getValidators',
      args: [],
    },
    {
      method: 'getNetworkSettings',
      args: [],
    },
    {
      method: 'runConsensusNow',
      args: [],
    },
    {
      method: 'updateSettings',
      args: [{ secondsPerBlock: 10 }],
    },
    {
      method: 'fastForwardOffset',
      args: [10],
    },
    {
      method: 'fastForwardToTime',
      args: [10],
    },
  ];

  beforeEach(() => {
    jsonProvider.request.mockClear();
  });

  for (const testCase of testCases) {
    const { method, args } = testCase;
    let expectedResult = expected;
    if (testCase.result != null) {
      expectedResult = testCase.result;
    }

    test(method, async () => {
      // $FlowFixMe
      const result = await provider[method](...args);

      expect(result).toEqual(expectedResult);
      expect(jsonProvider.request).toHaveBeenCalledTimes(1);
      expect(jsonProvider.request.mock.calls[0]).toMatchSnapshot();
    });
  }

  test('sendTransactionRaw throws RelayTransactionError', async () => {
    jsonProvider.request = jest.fn(() => Promise.resolve(false));

    const result = provider.sendTransactionRaw('');

    await expect(result).rejects.toEqual(
      new RelayTransactionError('Relay transaction failed.'),
    );
  });

  test('relayTransaction throws RelayTransactionError', async () => {
    jsonProvider.request = jest.fn(() =>
      Promise.reject(new JSONRPCError({ code: -110, message: '' })),
    );

    const result = provider.relayTransaction('');

    await expect(result).rejects.toEqual(new RelayTransactionError(''));
  });

  test('relayTransaction throws error', async () => {
    const error = new JSONRPCError({ code: -1, message: '' });
    jsonProvider.request = jest.fn(() => Promise.reject(error));

    const result = provider.relayTransaction('');

    await expect(result).rejects.toEqual(error);
  });

  test('getConnectedPeers', async () => {
    const expectedPeer = { connected: [] };
    const jsonProviderPeer = {
      request: jest.fn(() => Promise.resolve(expectedPeer)),
    };
    const providerPeer = new JSONRPCClient(jsonProviderPeer);

    const result = await providerPeer.getConnectedPeers();

    await expect(result).toEqual(expectedPeer.connected);
  });
});
