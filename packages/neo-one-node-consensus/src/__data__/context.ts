import { common, UInt160 } from '@neo-one/client-common';
import { ConsensusContext, NativeContractStorageContext, TransactionVerificationContext } from '@neo-one/node-core';
import { BN } from 'bn.js';
import { keys } from './keys';

const validators = keys.map(({ publicKey }) => publicKey);
const previousHash = common.stringToUInt256('0xd42561e3d30e15be6400b6df2f328e02d2bf6354c41dce433bc57687c82144bf');

const blockReceivedTimeMS = 1513018010000;

const viewNumber = 0;
const primaryIndex = 1;
const blockIndex = primaryIndex;
const backupIndex = 2;
const getBackupContext = (getGasBalance: (storage: NativeContractStorageContext, sender: UInt160) => Promise<BN>) =>
  new ConsensusContext({
    blockOptions: {
      previousHash,
      index: blockIndex,
      consensusData: { primaryIndex },
    },
    viewNumber,
    myIndex: backupIndex,
    validators,
    blockReceivedTimeMS,
    verificationContext: new TransactionVerificationContext({ getGasBalance }),
  });

const backupPrivateKey = keys[backupIndex].privateKey;

const getPrimaryContext = (getGasBalance: (storage: NativeContractStorageContext, sender: UInt160) => Promise<BN>) =>
  new ConsensusContext({
    blockOptions: {
      previousHash,
      index: blockIndex,
      consensusData: { primaryIndex },
    },
    viewNumber,
    myIndex: primaryIndex,
    validators,
    blockReceivedTimeMS,
    verificationContext: new TransactionVerificationContext({ getGasBalance }),
  });

const primaryPrivateKey = keys[primaryIndex].privateKey;

export const context = {
  backupPrivateKey,
  primaryPrivateKey,
  previousHash,
  getBackupContext,
  getPrimaryContext,
};
