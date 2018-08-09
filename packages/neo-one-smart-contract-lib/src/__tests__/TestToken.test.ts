// wallaby.skip
import { InvokeReceipt, privateKeyToScriptHash, TransactionResult } from '@neo-one/client';
import BigNumber from 'bignumber.js';
import { setupContractTest } from '@neo-one/smart-contract-compiler';
import { testToken } from '../__data__';
import * as path from 'path';

const setup = async () => setupContractTest(path.resolve(__dirname, '..', '__data__', 'contracts'), 'TestToken');

describe('TestToken', () => {
  test('properties + issue + balanceOf + totalSupply + transfer', async () => {
    await testToken({
      setup,
      name: 'TestToken',
      symbol: 'TT',
      decimals: 4,
      deploy: async ({ masterPrivateKey, masterAccountID, smartContract }) =>
        smartContract.deploy(privateKeyToScriptHash(masterPrivateKey), {
          from: masterAccountID,
        }) as Promise<TransactionResult<InvokeReceipt>>,
      issueValue: new BigNumber('100'),
      transferValue: new BigNumber('10'),
    });
  });
});
