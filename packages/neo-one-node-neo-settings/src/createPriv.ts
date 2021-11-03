import { common as clientCommon, crypto } from '@neo-one/client-common';
import { Settings } from '@neo-one/node-core';
import { constants } from '@neo-one/utils';
import { common, getMaxValidUntilBlockIncrement } from './common';

const DEFAULT_VALIDATORS: readonly string[] = [constants.PRIVATE_NET_PUBLIC_KEY];
const DEFAULT_VALIDATORS_COUNT = 1;

export const createPriv = ({
  standbyValidators: standbyValidatorsIn = DEFAULT_VALIDATORS,
  network = 7630401,
  millisecondsPerBlock,
  validatorsCount = DEFAULT_VALIDATORS_COUNT,
}: {
  readonly standbyValidators?: readonly string[];
  readonly millisecondsPerBlock?: number;
  readonly network?: number;
  readonly validatorsCount?: number;
} = {}): Settings => {
  const standbyCommittee = standbyValidatorsIn.map((value) => clientCommon.stringToECPoint(value));
  const standbyValidators = standbyCommittee.slice(0, validatorsCount);

  const consensusAddress = crypto.getBFTAddress(standbyValidators);

  const commonSettings = common({
    privateNet: true,
    consensusAddress,
    network,
  });

  const millisecondsPerBlockFinal =
    millisecondsPerBlock === undefined ? commonSettings.millisecondsPerBlock : millisecondsPerBlock;
  if (millisecondsPerBlockFinal === 0) {
    throw new Error('millisecondsPerBlock cannot be 0');
  }

  return {
    genesisBlock: commonSettings.genesisBlock,
    decrementInterval: commonSettings.decrementInterval,
    generationAmount: commonSettings.generationAmount,
    millisecondsPerBlock:
      millisecondsPerBlock === undefined ? commonSettings.millisecondsPerBlock : millisecondsPerBlock,
    maxValidUntilBlockIncrement: getMaxValidUntilBlockIncrement(millisecondsPerBlockFinal),
    standbyCommittee,
    committeeMembersCount: standbyCommittee.length,
    memoryPoolMaxTransactions: commonSettings.memoryPoolMaxTransactions,
    validatorsCount,
    network,
    maxIteratorResultItems: commonSettings.maxIteratorResultItems,
    addressVersion: clientCommon.NEO_ADDRESS_VERSION,
    privateKeyVersion: clientCommon.NEO_PRIVATE_KEY_VERSION,
    standbyValidators,
    maxBlockSize: commonSettings.maxBlockSize,
    maxBlockSystemFee: commonSettings.maxBlockSystemFee,
    nativeUpdateHistory: commonSettings.nativeUpdateHistory,
    maxTransactionsPerBlock: commonSettings.maxTransactionsPerBlock,
    maxTraceableBlocks: commonSettings.maxTraceableBlocks,
    initialGasDistribution: commonSettings.initialGasDistribution,
  };
};
