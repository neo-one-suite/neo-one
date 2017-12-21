/* @flow */
import JSONRPCBasicClientBaseProvider from '../../json/JSONRPCBasicClientBaseProvider';
import { SendTransactionError } from '../../errors';

import { keys, transactions } from '../../__data__';

jest.mock('isomorphic-fetch');

describe('JSONRPCBasicClientBaseProvider', () => {
  const expected = { result: true };
  const jsonProvider = { request: jest.fn(() => Promise.resolve(expected)) };
  const provider = new JSONRPCBasicClientBaseProvider(jsonProvider);
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
      method: 'getBestBlockHash',
      args: [],
    },
    {
      method: 'getBlockCount',
      args: [],
    },
    {
      method: 'getContract',
      args: [keys[0].scriptHashUInt160],
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
      method: 'getStorage',
      args: [keys[0].scriptHashUInt160, Buffer.from('123', 'hex')],
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
      args: [Buffer.alloc(0, 0)],
    },
  ];

  beforeEach(() => {
    jsonProvider.request.mockClear();
  });

  for (const testCase of testCases) {
    const { method, args } = testCase;

    test(method, async () => {
      // $FlowFixMe
      const result = await provider[method](...args);

      expect(result).toBe(expected);
      expect(jsonProvider.request).toHaveBeenCalledTimes(1);
      expect(jsonProvider.request.mock.calls[0]).toMatchSnapshot();
    });
  }

  test('sendTransactionRaw throws SendTransactionError', async () => {
    jsonProvider.request = jest.fn(() => Promise.resolve(false));

    const result = provider.sendTransactionRaw(Buffer.alloc(0, 0));

    await expect(result).rejects.toEqual(new SendTransactionError());
  });
});
