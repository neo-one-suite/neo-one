import { InvokeReceipt, privateKeyToScriptHash, TransactionResult } from '@neo-one/client';
import BigNumber from 'bignumber.js';
import { setupContractTest } from '@neo-one/smart-contract-compiler';
import { testToken } from '../__data__';
import * as path from 'path';

const issueValue = new BigNumber('1000000');

const setup = async () =>
  setupContractTest({
    dir: path.resolve(__dirname, '..', '__data__', 'contracts'),
    contractName: 'RedToken',
  });

describe('RedToken', () => {
  test('properties + issue + balanceOf + totalSupply + transfer', async () => {
    await testToken({
      setup,
      name: 'RedToken',
      symbol: 'RT',
      decimals: 8,
      deploy: async ({ masterPrivateKey, masterAccountID, smartContract }) =>
        smartContract.deploy(privateKeyToScriptHash(masterPrivateKey), issueValue, {
          from: masterAccountID,
        }) as Promise<TransactionResult<InvokeReceipt>>,
      issueValue,
      transferValue: new BigNumber('10'),
    });
  });
});
