import BigNumber from 'bignumber.js';
import { privateKeyToScriptHash } from '@neo-one/client';

import { testToken } from '../__data__';

testToken({
  contractName: 'TestToken',
  name: 'TestToken',
  symbol: 'TT',
  decimals: 4,
  deploy: async ({ masterPrivateKey, masterAccountID, smartContract }) =>
    smartContract.deploy(privateKeyToScriptHash(masterPrivateKey), {
      from: masterAccountID,
    }),
  issueValue: new BigNumber('100'),
  transferValue: new BigNumber('10'),
  contractHash: '0xcda5ae3ce34a488a7e6642b42ec2d853553d4ef8',
  dir: 'token',
});
