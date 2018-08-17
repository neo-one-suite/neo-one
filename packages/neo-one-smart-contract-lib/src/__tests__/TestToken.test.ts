import { InvokeReceipt, TransactionResult } from '@neo-one/client';
import { setupContractTest, SetupTestResult } from '@neo-one/smart-contract-test';
import BigNumber from 'bignumber.js';
import * as path from 'path';
import { testToken } from '../__data__';

const setup = async () =>
  setupContractTest(path.resolve(__dirname, '..', '__data__', 'contracts', 'TestToken.ts'), 'TestToken');

describe('TestToken', () => {
  let result: SetupTestResult;
  beforeEach(async () => {
    result = await setup();
  });

  afterEach(async () => {
    await result.cleanup();
  });

  test('properties + issue + balanceOf + totalSupply + transfer', async () => {
    await testToken({
      result,
      name: 'TestToken',
      symbol: 'TT',
      decimals: 4,
      deploy: async ({ masterAccountID, smartContract }) =>
        smartContract.deploy(masterAccountID.address, {
          from: masterAccountID,
        }) as Promise<TransactionResult<InvokeReceipt>>,
      issueValue: new BigNumber('100'),
      transferValue: new BigNumber('10'),
      description: 'The TestToken',
      payable: true,
    });
  });
});
