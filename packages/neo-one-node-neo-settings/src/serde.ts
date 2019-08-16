import { common } from '@neo-one/client-common';
import { Block, deserializeTransactionWire, RegisterTransaction, Settings } from '@neo-one/node-core';
import { BN } from 'bn.js';
import _ from 'lodash';

export const serializeSettings = (settings: Settings) => {
  const {
    genesisBlock,
    governingToken,
    utilityToken,
    decrementInterval,
    generationAmount,
    fees,
    registerValidatorFee,
    messageMagic,
    addressVersion,
    privateKeyVersion,
    standbyValidators,
    vm,
    secondsPerBlock,
    maxTransactionsPerBlock,
    memPoolSize,
  } = settings;

  return {
    genesisBlock: genesisBlock.serializeWire().toString('hex'),
    governingToken: governingToken.serializeWire().toString('hex'),
    utilityToken: utilityToken.serializeWire().toString('hex'),
    decrementInterval,
    generationAmount,
    fees: _.fromPairs(
      Object.entries(fees).map(([key, fee]) => [key, fee === undefined ? JSON.stringify(undefined) : fee.toString(10)]),
    ),
    registerValidatorFee: registerValidatorFee.toString(10),
    messageMagic,
    addressVersion,
    privateKeyVersion,
    standbyValidators: standbyValidators.map((validator) => common.ecPointToString(validator)),
    vm,
    secondsPerBlock,
    maxTransactionsPerBlock,
    memPoolSize,
  };
};

// tslint:disable-next-line no-any
export const deserializeSettings = (settings: any): Settings => {
  const {
    genesisBlock,
    governingToken,
    utilityToken,
    decrementInterval,
    generationAmount,
    fees,
    registerValidatorFee,
    messageMagic,
    addressVersion,
    privateKeyVersion,
    standbyValidators,
    vm,
    secondsPerBlock,
    maxTransactionsPerBlock,
    memPoolSize,
  } = settings;

  const context = { messageMagic };

  return {
    genesisBlock: Block.deserializeWire({ context, buffer: Buffer.from(genesisBlock, 'hex') }),
    governingToken: deserializeTransactionWire({
      context,
      buffer: Buffer.from(governingToken, 'hex'),
    }) as RegisterTransaction,
    utilityToken: deserializeTransactionWire({
      context,
      buffer: Buffer.from(utilityToken, 'hex'),
    }) as RegisterTransaction,
    decrementInterval,
    generationAmount,
    fees: _.fromPairs(
      Object.entries(fees).map(([key, fee]) => [key, fee === undefined ? undefined : new BN(fee as string, 10)]),
    ),
    registerValidatorFee: new BN(registerValidatorFee, 10),
    messageMagic,
    addressVersion,
    privateKeyVersion,
    standbyValidators: standbyValidators.map((validator: string) => common.stringToECPoint(validator)),
    vm,
    secondsPerBlock,
    maxTransactionsPerBlock,
    memPoolSize,
  };
};
