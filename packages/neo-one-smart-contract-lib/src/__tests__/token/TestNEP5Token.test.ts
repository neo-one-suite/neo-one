import { tokenTester } from '../../__data__';
import BigNumber from 'bignumber.js';
import * as path from 'path';

const issueValue = new BigNumber('1000000');

describe('TestNEP5Token', () => {
  test('properties + issue + balanceOf + totalSupply + transfer', async () => {
    await tokenTester({
      name: 'TestNEP5Token',
      filePath: path.resolve(__dirname, '..', '..', '__data__', 'contracts', 'token', 'TestNEP5Token.ts'),
      smartContractName: 'testNep5Token',
      symbol: 'TT',
      decimals: 8,
      deploy: async ({ masterAccountID, smartContract }) =>
        smartContract.deploy(masterAccountID.address, {
          from: masterAccountID,
        }) as Promise<TransactionResult<InvokeReceipt>>,
      issueValue,
      transferValue: new BigNumber('10'),
      description: 'The TestNEP5Token',
      payable: false,
    });
  });
});
