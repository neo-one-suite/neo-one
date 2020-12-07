import { common } from '@neo-one/client-common';
import { Block, Settings } from '@neo-one/node-core';

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
  };
};
