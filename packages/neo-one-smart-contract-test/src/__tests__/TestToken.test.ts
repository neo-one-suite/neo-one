import { InvokeReceipt, TransactionResult } from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import * as path from 'path';
import { testToken } from '../__data__';

describe('TestToken', () => {
  test('properties + issue + balanceOf + totalSupply + transfer', async () => {
    await testToken({
      name: 'TestToken',
      filePath: path.resolve(__dirname, '..', '__data__', 'contracts', 'TestToken.ts'),
      smartContractName: 'testToken',
      symbol: 'TT',
      decimals: 8,
      deploy: async ({ masterAccountID, smartContract }) =>
        smartContract.deploy(masterAccountID.address, {
          from: masterAccountID,
        }) as Promise<TransactionResult<InvokeReceipt>>,
      issueValue: new BigNumber('100'),
      transferValue: new BigNumber('10'),
      description: 'The TestToken',
      payable: false,
    });
  });
});
