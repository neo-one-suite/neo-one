/* @flow */
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

import ClientBase from '../../ClientBase';

import { keys, transactions } from '../../__data__';
import param from '../../converters/param';

const client = new ClientBase();

describe('param', () => {
  test('convert BigNumber to BN', () => {
    const expected = '10';
    const value = new BigNumber(expected);

    const result = param(client, value);

    expect(result).toBeInstanceOf(BN);
    expect(((result: $FlowFixMe): BN).toString(10)).toEqual(expected);
  });

  test('error on non-integer BigNumber', () => {
    try {
      param(client, new BigNumber('10.1'));
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });

  test('convert number to BN', () => {
    const expected = 10;

    const result = param(client, expected);

    expect(result).toBeInstanceOf(BN);
    expect(((result: $FlowFixMe): BN).toNumber()).toEqual(expected);
  });

  test('error on non-integer number', () => {
    try {
      param(client, 10.1);
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });

  test('return booleans', () => {
    expect(param(client, true)).toEqual(true);
    expect(param(client, false)).toEqual(false);
  });

  test('convert string Hash160 to UInt160', () => {
    expect(param(client, keys[0].scriptHash)).toEqual(
      keys[0].scriptHashUInt160,
    );
  });

  test('convert string Hash256 to UInt256', () => {
    expect(param(client, transactions.register.hashHex)).toEqual(
      transactions.register.hash,
    );
  });

  test('convert string number to BN', () => {
    const expected = '10';

    const result = param(client, '10');
    expect(result).toBeInstanceOf(BN);
    expect(((result: $FlowFixMe): BN).toString(10)).toEqual(expected);
  });

  test('return other strings', () => {
    const expected = '0xfoobar';

    expect(param(client, expected)).toEqual(expected);
  });

  test('return other Buffers', () => {
    const expected = Buffer.alloc(10, 1);

    expect(param(client, expected)).toEqual(expected);
  });

  test('returns BN', () => {
    const expected = '10';

    const result = param(client, new BN(expected, 10));
    expect(result).toBeInstanceOf(BN);
    expect(((result: $FlowFixMe): BN).toString(10)).toEqual(expected);
  });

  test('convert Arrays', () => {
    // $FlowFixMe
    expect(param(client, [keys[0].scriptHash])).toEqual([
      keys[0].scriptHashUInt160,
    ]);
  });

  test('throw on other types', () => {
    try {
      // $FlowFixMe
      param(client, {});
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
