import { ECPoint } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Block } from './Block';
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
  readonly generationAmount: readonly number[];
  readonly fees: { [K in TransactionType]?: BN };
  readonly registerValidatorFee: BN;
  readonly messageMagic: number;
  readonly addressVersion: number;
  readonly privateKeyVersion: number;
  readonly standbyValidators: readonly ECPoint[];
  readonly vm: VMSettings;
  readonly secondsPerBlock: number;
  readonly maxTransactionsPerBlock: number;
  readonly memPoolSize: number;
  readonly getFreeGas?: (index: number) => BN;
}
