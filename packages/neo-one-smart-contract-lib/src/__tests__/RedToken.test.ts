import BigNumber from 'bignumber.js';
import { privateKeyToScriptHash } from '@neo-one/client';

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
    }),
  issueValue,
  transferValue: new BigNumber('10'),
  contractHash: '0xa5e724ae2a146f9a9ac9bc44f9d82ad9bf14ccd1',
  dir: 'red',
});
