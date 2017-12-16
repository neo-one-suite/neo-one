/* @flow */
import BigNumber from 'bignumber.js';

import number from '../../converters/number';

const decimals = 4;
const expected = '100000';

describe('number', () => {
  test('converts string to BN', () => {
    expect(number('10', decimals).toString(10)).toEqual(expected);
  });

  test('converts number to BN', () => {
    expect(number(10, decimals).toString(10)).toEqual(expected);
  });

  test('converts BigNumber to BN', () => {
    expect(number(new BigNumber(10), decimals).toString(10)).toEqual(expected);
  });

  test('throws on other input', () => {
    try {
      // $FlowFixMe
      number({}, decimals);
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });

  test('throws on other decimals input', () => {
    try {
      // $FlowFixMe
      number(10, {});
      expect(false).toBeTruthy();
    } catch (error) {
      expect(error.code).toEqual('INVALID_ARGUMENT');
    }
  });
});
