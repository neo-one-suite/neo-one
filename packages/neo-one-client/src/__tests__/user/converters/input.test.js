/* @flow */
import { common } from '@neo-one/client-core';

import input from '../../../user/converters/input';

const txidString =
  '798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca';
const hash = common.stringToUInt256(
  '798fb9e4f3437e4c9ab83c24f950f0fce98e1d1aaac4fe3f54a66c5d9def89ca',
);
const vout = 2;

describe('input', () => {
  test('converts to input', () => {
    const testInput = input({
      txid: txidString,
      vout,
    });
    expect({
      hash: testInput.hash,
      index: testInput.index,
    }).toEqual({
      hash,
      index: vout,
    });
  });
});
