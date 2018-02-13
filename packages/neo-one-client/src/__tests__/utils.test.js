/* @flow */
import BigNumber from 'bignumber.js';

import * as utils from '../utils';

describe('utils', () => {
  const hash = '0x3775292229eccdf904f16fff8e83e7cffdc0f0ce';
  const method = 'method';
  const params = [];

  test('bigNumberToBN', () => {
    const bigNum = new BigNumber('10');
    const decimals = 10;

    const result = utils.bigNumberToBN(bigNum, decimals);
    expect(result.toString(10)).toEqual(String(10 * 10 ** 10));
  });

  test('getInvokeMethodInvocationScript', () => {
    const result = utils.getInvokeMethodInvocationScript({ method, params });

    expect(result).toMatchSnapshot();
  });

  test('getInvokeMethodScript', () => {
    const result = utils.getInvokeMethodScript({ hash, method, params });

    expect(result).toMatchSnapshot();
  });
});
