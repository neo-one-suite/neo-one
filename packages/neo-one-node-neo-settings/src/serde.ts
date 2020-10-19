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
    // fees: _.fromPairs(
    //   Object.entries(fees).map(([key, fee]) => [key, fee === undefined ? JSON.stringify(undefined) : fee.toString(10)]),
    // ),
    privateKeyVersion,
    standbyValidators: standbyValidators.map((validator) => common.ecPointToString(validator)),
    standbyCommittee: standbyCommittee.map((validator) => common.ecPointToString(validator)),
    committeeMembersCount,
    validatorsCount,
    // registerValidatorFee: registerValidatorFee.toString(10),
    messageMagic,
    addressVersion,
    // vm,
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

  const context = { messageMagic };

  return {
    genesisBlock: Block.deserializeWire({ context, buffer: Buffer.from(genesisBlock, 'hex') }),
    decrementInterval,
    generationAmount,
    // fees: _.fromPairs(
    //   Object.entries(fees).map(([key, fee]) => [key, fee === undefined ? undefined : new BN(fee as string, 10)]),
    // ),
    // registerValidatorFee: new BN(registerValidatorFee, 10),
    messageMagic,
    addressVersion,
    privateKeyVersion,
    standbyValidators: standbyValidators.map((validator: string) => common.stringToECPoint(validator)),
    standbyCommittee: standbyCommittee.map((validator: string) => common.stringToECPoint(validator)),
    committeeMembersCount,
    validatorsCount,
    // vm,
    millisecondsPerBlock,
    memoryPoolMaxTransactions,
  };
};
