/* @flow */
/* eslint-disable no-loop-func */
// flowlint unclear-type:off
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

import Client from '../Client';

import { keys, transactions } from '../__data__';
import params from '../params';

const testCases = [
  {
    type: 'String',
    success: ['foo'],
    error: [0],
    expected: 'foo',
  },
  {
    type: 'Hash160',
    success: [keys[0].scriptHash, keys[0].scriptHashBuffer],
    error: [10],
    expected: keys[0].scriptHashBuffer,
  },
  {
    type: 'Hash256',
    success: [transactions.register.hash, transactions.register.hashHex],
    error: [10],
    expected: transactions.register.hash,
  },
  {
    type: 'PublicKey',
    success: [keys[0].publicKey, keys[0].publicKeyBuffer],
    error: [10],
    expected: keys[0].publicKeyBuffer,
  },
  {
    type: 'Integer',
    success: [10, '10', new BigNumber('10')],
    error: true,
    expected: '10',
    mapResult: (result: BN) => result.toString(10),
  },
  {
    type: 'Boolean',
    success: [true],
    error: 'foobar',
    expected: true,
  },
  {
    type: 'ByteArray',
    success: [keys[0].publicKey, keys[0].publicKeyBuffer],
    error: 20,
    expected: keys[0].publicKeyBuffer,
  },
  {
    type: 'Signature',
    success: [keys[0].publicKey, keys[0].publicKeyBuffer],
    error: 20,
    expected: keys[0].publicKeyBuffer,
  },
  {
    type: 'Void',
    success: [undefined],
    error: 20,
    expected: Buffer.alloc(0, 0),
  },
];

const testError = (func: () => any) => {
  let err;
  try {
    func();
  } catch (errr) {
    err = errr;
  }

  expect(err).toBeTruthy();
  if (err != null) {
    expect(err).toHaveProperty('code');
    expect(err.code).toEqual('INVALID_ARGUMENT');
  }
};

describe('params', () => {
  const client = new Client();
  for (const testCase of testCases) {
    const { type, success, error, expected } = testCase;
    // $FlowFixMe
    const { mapResult } = testCase;

    for (const successValue of success) {
      test(`${type}-success-${String(successValue)}`, () => {
        const result = params[type](client, (successValue: $FlowFixMe));

        expect(
          mapResult == null ? result : mapResult((result: $FlowFixMe)),
        ).toEqual(expected);
      });
    }

    test(`${type}-error-${String(error)}`, () => {
      // $FlowFixMe
      testError(() => params[type](client, error));
    });
  }

  test('Array-success', () => {
    const expected = ['foobar'];

    const result = params.Array(client, (expected: $FlowFixMe));

    expect(result).toEqual(expected);
  });

  test('Array-error', () => {
    testError(() => params.Array(client, 'foobar'));
  });

  test('InteropInterface', () => {
    testError(() => params.InteropInterface(client, 'any'));
  });
});
