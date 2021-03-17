import { common as clientCommon, crypto } from '@neo-one/client-common';
import { Settings } from '@neo-one/node-core';
import { constants } from '@neo-one/utils';
import { common } from './common';

const DEFAULT_VALIDATORS: readonly string[] = [constants.PRIVATE_NET_PUBLIC_KEY];

export const createPriv = ({
  standbyValidators: standbyValidatorsIn = DEFAULT_VALIDATORS,
  extraCommitteeMembers: extraCommitteeMembersIn = [],
  messageMagic = 7630401,
  millisecondsPerBlock,
}: {
  readonly standbyValidators?: readonly string[];
  readonly extraCommitteeMembers?: readonly string[];
  readonly millisecondsPerBlock?: number;
  readonly messageMagic?: number;
} = {}): Settings => {
  const standbyValidators = standbyValidatorsIn.map((value) => clientCommon.stringToECPoint(value));
  const standbyMembers = extraCommitteeMembersIn.map((value) => clientCommon.stringToECPoint(value));
  const standbyCommittee = standbyValidators.concat(standbyMembers);

  const consensusAddress = crypto.getBFTAddress(standbyValidators);

  const commonSettings = common({
    privateNet: true,
    consensusAddress,
    messageMagic,
  });

  return {
    genesisBlock: commonSettings.genesisBlock,
    decrementInterval: commonSettings.decrementInterval,
    generationAmount: commonSettings.generationAmount,
    millisecondsPerBlock:
      millisecondsPerBlock === undefined ? commonSettings.millisecondsPerBlock : millisecondsPerBlock,
    standbyCommittee,
    committeeMembersCount: standbyCommittee.length,
    memoryPoolMaxTransactions: commonSettings.memoryPoolMaxTransactions,
    validatorsCount: standbyValidators.length,
    messageMagic,
    addressVersion: clientCommon.NEO_ADDRESS_VERSION,
    privateKeyVersion: clientCommon.NEO_PRIVATE_KEY_VERSION,
    standbyValidators,
    nativeActivations: commonSettings.nativeActivations,
  };
};
