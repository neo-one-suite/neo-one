/* @flow */
import { common } from '@neo-one/core';

import input from '../../converters/input';

const string =
  '0xca89ef9d5d6ca6543ffec4aa1a1d8ee9fcf050f9243cb89a4c7e43f3e4b98f79';
const value = common.bufferToUInt256(
  Buffer.from(
    '798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
    'hex',
  ),
);
const vout = 2;

describe('input', () => {
  test('converts to Input', async () => {
    const inputValue = input({
      txid: string,
      vout,
    });
    expect({
      hash: inputValue.hash,
      index: inputValue.index,
    }).toEqual({
      hash: value,
      index: vout,
    });
  });

  test('throws on invalid input', () => {
    try {
      // $FlowFixMe
      input(false);
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });

  test('throws on other input', () => {
    try {
      // $FlowFixMe
      input({ txid: string, vout: false });
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
