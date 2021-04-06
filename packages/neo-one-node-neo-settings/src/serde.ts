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
    messageMagic,
    addressVersion,
    standbyCommittee,
    committeeMembersCount,
    validatorsCount,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    maxTraceableBlocks,
    nativeUpdateHistory,
    maxBlockSize,
    maxBlockSystemFee,
    maxTransactionsPerBlock,
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
    messageMagic,
    addressVersion,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    maxTraceableBlocks,
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
    messageMagic,
    addressVersion,
    standbyCommittee,
    committeeMembersCount,
    validatorsCount,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    maxTraceableBlocks,
    nativeUpdateHistory,
    maxBlockSize,
    maxBlockSystemFee,
    maxTransactionsPerBlock,
  } = settings;

  const context = { messageMagic, validatorsCount };

  return {
    genesisBlock: Block.deserializeWire({ context, buffer: Buffer.from(genesisBlock, 'hex') }),
    decrementInterval,
    generationAmount,
    messageMagic,
    addressVersion,
    privateKeyVersion,
    standbyValidators: standbyValidators.map((validator: string) => common.stringToECPoint(validator)),
    standbyCommittee: standbyCommittee.map((validator: string) => common.stringToECPoint(validator)),
    committeeMembersCount,
    validatorsCount,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    maxTraceableBlocks,
    nativeUpdateHistory,
    maxBlockSize,
    maxBlockSystemFee: new BN(maxBlockSystemFee),
    maxTransactionsPerBlock,
  };
};
