/* @flow */
import BN from 'bn.js';
import BigNumber from 'bignumber.js';

import common from '../common';

const decimals = 4;
const expected = '100000';

describe('fixedFromDecimal', () => {
  test('converts string to BN', () => {
    expect(common.fixedFromDecimal('10', decimals).toString(10)).toEqual(
      expected,
    );
  });

  test('converts number to BN', () => {
    expect(common.fixedFromDecimal(10, decimals).toString(10)).toEqual(
      expected,
    );
  });

  test('converts BigNumber to BN', () => {
    expect(
      common.fixedFromDecimal(new BigNumber(10), decimals).toString(10),
    ).toEqual(expected);
  });

  test('converts BN to BN', () => {
    expect(
      common.fixedFromDecimal(new BN(expected, 10), decimals).toString(10),
    ).toEqual(expected);
  });
});
