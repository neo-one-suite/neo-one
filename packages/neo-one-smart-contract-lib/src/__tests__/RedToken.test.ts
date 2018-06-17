import { InvokeReceipt, privateKeyToScriptHash, TransactionResult } from '@neo-one/client';
import BigNumber from 'bignumber.js';

import { testToken } from '../__data__';

const issueValue = new BigNumber('1000000');

testToken({
  contractName: 'RedToken',
  name: 'RedToken',
  symbol: 'RT',
  decimals: 8,
  deploy: async ({ masterPrivateKey, masterAccountID, smartContract }) =>
    smartContract.deploy(privateKeyToScriptHash(masterPrivateKey), issueValue, {
      from: masterAccountID,
    }) as Promise<TransactionResult<InvokeReceipt>>,
  issueValue,
  transferValue: new BigNumber('10'),
  contractHash: '0xf30b143036410a36490061d57f9dd778366da376',
  dir: 'red',
});
