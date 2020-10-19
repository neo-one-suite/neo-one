import { common } from '@neo-one/client-common';
import { Block, Settings } from '@neo-one/node-core';
import _ from 'lodash';

export const serializeSettings = (settings: Settings) => {
  const {
    genesisBlock,
    decrementInterval,
    generationAmount,
    messageMagic,
    addressVersion,
    privateKeyVersion,
    standbyValidators,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    standbyCommittee,
  } = settings;

  return {
    genesisBlock: genesisBlock.serializeWire().toString('hex'),
    decrementInterval,
    generationAmount,
    messageMagic,
    addressVersion,
    privateKeyVersion,
    standbyValidators: standbyValidators.map((validator) => common.ecPointToString(validator)),
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    standbyCommittee: standbyCommittee.map((validator) => common.ecPointToString(validator)),
  };
};

// tslint:disable-next-line no-any
export const deserializeSettings = (settings: any): Settings => {
  const {
    genesisBlock,
    decrementInterval,
    generationAmount,
    messageMagic,
    addressVersion,
    privateKeyVersion,
    standbyValidators,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    standbyCommittee,
    validatorsCount,
    committeeMembersCount,
  } = settings;

  const context = { messageMagic };

  return {
    genesisBlock: Block.deserializeWire({ context, buffer: Buffer.from(genesisBlock, 'hex') }),
    decrementInterval,
    generationAmount,
    messageMagic,
    addressVersion,
    privateKeyVersion,
    standbyValidators: standbyValidators.map((validator: string) => common.stringToECPoint(validator)),
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
    standbyCommittee: standbyCommittee.map((validator: string) => common.stringToECPoint(validator)),
    committeeMembersCount,
    validatorsCount,
  };
};
