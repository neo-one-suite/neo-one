// wallaby.skip
import { InvokeReceipt, privateKeyToScriptHash, TransactionResult } from '@neo-one/client';
import BigNumber from 'bignumber.js';
import { setupContractTest, SetupTestResult } from '@neo-one/smart-contract-compiler';
import { testToken } from '../__data__';
import * as path from 'path';

const issueValue = new BigNumber('1000000');

const setup = async () =>
  setupContractTest(path.resolve(__dirname, '..', '__data__', 'contracts', 'RedToken.ts'), 'RedToken');

describe('RedToken', () => {
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
      name: 'RedToken',
      symbol: 'RT',
      decimals: 8,
      deploy: async ({ masterPrivateKey, masterAccountID, smartContract }) =>
        smartContract.deploy(privateKeyToScriptHash(masterPrivateKey), issueValue, {
          from: masterAccountID,
        }) as Promise<TransactionResult<InvokeReceipt>>,
      issueValue,
      transferValue: new BigNumber('10'),
      description: 'The RedToken',
      payable: false,
    });
  });
});
