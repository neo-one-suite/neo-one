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
  contractHash: '0x6937b11039ba775836c32682738bac4e4922d671',
  dir: 'red',
});
