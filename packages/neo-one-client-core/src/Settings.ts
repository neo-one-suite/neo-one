import BN from 'bn.js';
import { Block } from './Block';
import { ECPoint } from './common';
import { RegisterTransaction, TransactionType } from './transaction';

export interface VMSettings {
  readonly storageContext: {
    readonly v0: {
      readonly index: number;
    };
  };
}

export interface Settings {
  readonly genesisBlock: Block;
  readonly governingToken: RegisterTransaction;
  readonly utilityToken: RegisterTransaction;
  readonly decrementInterval: number;
  readonly generationAmount: ReadonlyArray<number>;
  readonly fees: { [K in keyof TransactionType]: BN };
  readonly registerValidatorFee: BN;
  readonly messageMagic: number;
  readonly addressVersion: number;
  readonly privateKeyVersion: number;
  readonly standbyValidators: ReadonlyArray<ECPoint>;
  readonly vm: VMSettings;
  readonly secondsPerBlock: number;
  readonly maxTransactionsPerBlock: number;
  readonly memPoolSize: number;
}
