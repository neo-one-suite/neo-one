/* @flow */
import BigNumber from 'bignumber.js';

import { JSONRPCClientProvider } from '../../json';

import { keys, transactions } from '../../__data__';

jest.mock('isomorphic-fetch');

describe('JSONRPCClientProvider', () => {
  const expected = '10';
  const jsonProvider = { request: jest.fn(() => Promise.resolve(expected)) };
  const provider = new JSONRPCClientProvider(jsonProvider);
  const testCases = [
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
      args: [keys[0].scriptHashUInt160],
    },
    {
      method: 'getActions',
      args: [{}],
    },
    {
      method: 'getActions',
      args: [{ scriptHash: keys[0].scriptHashUInt160 }],
    },
    {
      method: 'testInvocation',
      args: [Buffer.alloc(1, 0)],
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
});
