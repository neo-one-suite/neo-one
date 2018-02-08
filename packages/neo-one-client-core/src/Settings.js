/* @flow */
import type BN from 'bn.js';

import type Block from './Block';
import type { ECPoint } from './common';
import type { TransactionType, RegisterTransaction } from './transaction';

export type VMSettings = {|
  storageContext: {|
    v0: {|
      index: number,
    |},
  |},
|};
export type Settings = {|
  +genesisBlock: Block,
  +governingToken: RegisterTransaction,
  +utilityToken: RegisterTransaction,
  +decrementInterval: number,
  +generationAmount: Array<number>,
  +fees: { [transactionType: TransactionType]: BN },
  +registerValidatorFee: BN,
  +messageMagic: number,
  +addressVersion: number,
  +privateKeyVersion: number,
  +standbyValidators: Array<ECPoint>,
  +vm: VMSettings,
  +secondsPerBlock: number,
  +maxTransactionsPerBlock: number,
|};
