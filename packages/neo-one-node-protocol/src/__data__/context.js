/* @flow */
import _ from 'lodash';
import { common } from '@neo-one/client-core';

import { Context } from '../consensus/context';

import keys from './keys';

const validators = keys.map(({ publicKey }) => publicKey);
const previousHash = common.stringToUInt256(
  '0xd42561e3d30e15be6400b6df2f328e02d2bf6354c41dce433bc57687c82144bf',
);
const expectedView = _.range(0, 7).map(() => 0);
const blockReceivedTimeSeconds = 1513018010;

const viewNumber = 0;
const primaryIndex = 1;
const blockIndex = primaryIndex;
const backupIndex = 2;
const backupContext = new Context({
  type: 'backup',
  previousHash,
  blockIndex,
  viewNumber,
  myIndex: backupIndex,
  primaryIndex,
  expectedView,
  validators,
  blockReceivedTimeSeconds,
});
const backupPrivateKey = keys[backupIndex].privateKey;

const primaryContext = new Context({
  type: 'primary',
  previousHash,
  blockIndex,
  viewNumber,
  myIndex: primaryIndex,
  primaryIndex,
  expectedView,
  validators,
  blockReceivedTimeSeconds,
});
const primaryPrivateKey = keys[primaryIndex].privateKey;

const blockSentBackupContext = backupContext.cloneBlockSent();
const initialBackupContext = backupContext.cloneInitial({
  type: 'backup',
  viewNumber,
  primaryIndex,
});
const blockSentPrimaryContext = primaryContext.cloneBlockSent();
const initialPrimaryContext = primaryContext.cloneInitial({
  type: 'primary',
  viewNumber,
  primaryIndex,
});

export default {
  backupPrivateKey,
  primaryPrivateKey,
  previousHash,
  blockSentBackupContext,
  initialBackupContext,
  blockSentPrimaryContext,
  initialPrimaryContext,
};
