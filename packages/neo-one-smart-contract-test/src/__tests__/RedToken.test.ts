import BigNumber from 'bignumber.js';
import * as path from 'path';
import { testToken } from '../__data__';

const issueValue = new BigNumber('1000000');

describe('RedToken', () => {
  test('properties + issue + balanceOf + totalSupply + transfer', async () => {
    await testToken({
      name: 'RedToken',
      filePath: path.resolve(__dirname, '..', '__data__', 'contracts', 'RedToken.ts'),
      smartContractName: 'redToken',
      symbol: 'RT',
      decimals: 8,
      issueValue,
      transferValue: new BigNumber('10'),
    });
  });
});
