import BigNumber from 'bignumber.js';
import * as utils from '../utils';
import { bigNumberToBN } from '@neo-one/client-core';

describe('utils', () => {
  const hash = '0x3775292229eccdf904f16fff8e83e7cffdc0f0ce';
  const method = 'method';
  const params: any[] = [];

  test('bigNumberToBN', () => {
    const bigNum = new BigNumber('10');
    const decimals = 10;

    const result = bigNumberToBN(bigNum, decimals);
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
