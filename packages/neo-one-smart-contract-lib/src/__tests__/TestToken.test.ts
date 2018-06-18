import { InvokeReceipt, privateKeyToScriptHash, TransactionResult } from '@neo-one/client';
import BigNumber from 'bignumber.js';

import { testToken } from '../__data__';

testToken({
  contractName: 'TestToken',
  name: 'TestToken',
  symbol: 'TT',
  decimals: 4,
  deploy: async ({ masterPrivateKey, masterAccountID, smartContract }) =>
    smartContract.deploy(privateKeyToScriptHash(masterPrivateKey), {
      from: masterAccountID,
    }) as Promise<TransactionResult<InvokeReceipt>>,
  issueValue: new BigNumber('100'),
  transferValue: new BigNumber('10'),
  contractHash: '0x728debdef21d035523583843adda67b43f464aac',
  dir: 'token',
});
