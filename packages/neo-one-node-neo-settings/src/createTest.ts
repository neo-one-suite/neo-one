import { common as clientCommon, crypto } from '@neo-one/client-common';
import { Settings } from '@neo-one/node-core';
import { common } from './common';

const DEFAULT_VALIDATORS: readonly string[] = [
  '023e9b32ea89b94d066e649b124fd50e396ee91369e8e2a6ae1b11c170d022256d',
  '03009b7540e10f2562e5fd8fac9eaec25166a58b26e412348ff5a86927bfac22a2',
  '02ba2c70f5996f357a43198705859fae2cfea13e1172962800772b3d588a9d4abd',
  '03408dcd416396f64783ac587ea1e1593c57d9fea880c8a6a1920e92a259477806',
  '02a7834be9b32e2981d157cb5bbd3acb42cfd11ea5c3b10224d7a44e98c5910f1b',
  '0214baf0ceea3a66f17e7e1e839ea25fd8bed6cd82e6bb6e68250189065f44ff01',
  '030205e9cefaea5a1dfc580af20c8d5aa2468bb0148f1a5e4605fc622c80e604ba',
];

const DEFAULT_EXTRA_MEMBERS: readonly string[] = [];

export const createTest = ({
  privateNet,
  standbyValidators: standbyValidatorsIn = DEFAULT_VALIDATORS,
  extraCommitteeMembers: extraCommitteeMembersIn = DEFAULT_EXTRA_MEMBERS,
  millisecondsPerBlock,
}: {
  readonly privateNet?: boolean;
  readonly millisecondsPerBlock?: number;
  readonly standbyValidators?: readonly string[];
  readonly extraCommitteeMembers?: readonly string[];
} = {}): Settings => {
  const standbyValidators = standbyValidatorsIn.map((value) => clientCommon.stringToECPoint(value));
  const standbyMembers = extraCommitteeMembersIn.map((value) => clientCommon.stringToECPoint(value));
  const standbyCommittee = standbyValidators.concat(standbyMembers);

  const consensusAddress = crypto.getConsensusAddress(standbyValidators);

  const commonSettings = common({
    privateNet,
    consensusAddress,
  });

  return {
    genesisBlock: commonSettings.genesisBlock,
    decrementInterval: commonSettings.decrementInterval,
    generationAmount: commonSettings.generationAmount,
    millisecondsPerBlock:
      millisecondsPerBlock === undefined ? commonSettings.millisecondsPerBlock : millisecondsPerBlock,
    // maxTransactionsPerBlock: commonSettings.maxTransactionsPerBlock,
    standbyCommittee,
    committeeMembersCount: standbyCommittee.length,
    memoryPoolMaxTransactions: commonSettings.memoryPoolMaxTransactions,
    validatorsCount: standbyValidators.length,
    // fees: {
    //   [TransactionType.Enrollment]: clientCommon.fixed8FromDecimal(10),
    //   [TransactionType.Issue]: clientCommon.fixed8FromDecimal(5),
    //   [TransactionType.Publish]: clientCommon.fixed8FromDecimal(5),
    //   [TransactionType.Register]: clientCommon.fixed8FromDecimal(100),
    // },
    // registerValidatorFee: clientCommon.fixed8FromDecimal(1000),
    messageMagic: 1951352142,
    addressVersion: clientCommon.NEO_ADDRESS_VERSION,
    privateKeyVersion: clientCommon.NEO_PRIVATE_KEY_VERSION,
    standbyValidators,
    // vm: {
    //   storageContext: {
    //     v0: {
    //       index: 163594,
    //     },
    //   },
    // },
  };
};
