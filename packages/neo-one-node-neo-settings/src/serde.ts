import { common } from '@neo-one/client-common';
import { Block, Settings } from '@neo-one/node-core';
import { BN } from 'bn.js';

export const serializeSettings = (settings: Settings) => {
  const {
    genesisBlock,
    decrementInterval,
    generationAmount,
    privateKeyVersion,
    standbyValidators,
    network,
    addressVersion,
    standbyCommittee,
    committeeMembersCount,
    validatorsCount,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    maxTraceableBlocks,
    initialGasDistribution,
    nativeUpdateHistory,
    maxBlockSize,
    maxBlockSystemFee,
    maxTransactionsPerBlock,
    maxValidUntilBlockIncrement,
    maxIteratorResultItems,
  } = settings;

  return {
    genesisBlock: genesisBlock.serializeWire().toString('hex'),
    decrementInterval,
    generationAmount,
    privateKeyVersion,
    standbyValidators: standbyValidators.map((validator) => common.ecPointToString(validator)),
    standbyCommittee: standbyCommittee.map((validator) => common.ecPointToString(validator)),
    committeeMembersCount,
    validatorsCount,
    network,
    maxValidUntilBlockIncrement,
    maxIteratorResultItems,
    addressVersion,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    maxTraceableBlocks,
    initialGasDistribution: initialGasDistribution.toString(),
    nativeUpdateHistory,
    maxBlockSize,
    maxBlockSystemFee: maxBlockSystemFee.toString(),
    maxTransactionsPerBlock,
  };
};

// tslint:disable-next-line no-any
export const deserializeSettings = (settings: any): Settings => {
  const {
    genesisBlock,
    decrementInterval,
    generationAmount,
    privateKeyVersion,
    standbyValidators,
    network,
    maxValidUntilBlockIncrement,
    maxIteratorResultItems,
    addressVersion,
    standbyCommittee,
    committeeMembersCount,
    validatorsCount,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    maxTraceableBlocks,
    initialGasDistribution,
    nativeUpdateHistory,
    maxBlockSize,
    maxBlockSystemFee,
    maxTransactionsPerBlock,
  } = settings;

  const context = { network, validatorsCount, maxValidUntilBlockIncrement };

  return {
    genesisBlock: Block.deserializeWire({ context, buffer: Buffer.from(genesisBlock, 'hex') }),
    decrementInterval,
    generationAmount,
    network,
    maxIteratorResultItems,
    maxValidUntilBlockIncrement,
    addressVersion,
    privateKeyVersion,
    standbyValidators: standbyValidators.map((validator: string) => common.stringToECPoint(validator)),
    standbyCommittee: standbyCommittee.map((validator: string) => common.stringToECPoint(validator)),
    committeeMembersCount,
    validatorsCount,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    maxTraceableBlocks,
    initialGasDistribution: new BN(initialGasDistribution),
    nativeUpdateHistory,
    maxBlockSize,
    maxBlockSystemFee: new BN(maxBlockSystemFee),
    maxTransactionsPerBlock,
  };
};
