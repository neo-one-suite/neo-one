import BN from 'bn.js';
import { Block } from './Block';
import { ECPoint } from './common';
import { RegisterTransaction, TransactionType } from './transaction';

export interface VMSettings {
  storageContext: {
    v0: {
      index: number;
    };
  };
}

export interface Settings {
  readonly genesisBlock: Block;
  readonly governingToken: RegisterTransaction;
  readonly utilityToken: RegisterTransaction;
  readonly decrementInterval: number;
  readonly generationAmount: number[];
  readonly fees: { [K in keyof TransactionType]: BN };
  readonly registerValidatorFee: BN;
  readonly messageMagic: number;
  readonly addressVersion: number;
  readonly privateKeyVersion: number;
  readonly standbyValidators: ECPoint[];
  readonly vm: VMSettings;
  readonly secondsPerBlock: number;
  readonly maxTransactionsPerBlock: number;
  readonly memPoolSize: number;
}
