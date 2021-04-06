import { ECPoint } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Block } from './Block';

export const DECREMENT_INTERVAL = 2000000;
export const GENERATION_AMOUNT: ReadonlyArray<number> = [6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

export interface BlockchainSettings extends ProtocolSettings {
  readonly genesisBlock: Block;
  readonly decrementInterval: number;
  readonly generationAmount: readonly number[];
  readonly privateKeyVersion: number;
  readonly standbyValidators: readonly ECPoint[];
}
export interface ProtocolSettings {
  readonly messageMagic: number;
  readonly addressVersion: number;
  readonly standbyCommittee: readonly ECPoint[];
  readonly committeeMembersCount: number;
  readonly validatorsCount: number;
  readonly millisecondsPerBlock: number;
  readonly memoryPoolMaxTransactions: number;
  readonly maxTraceableBlocks: number;
  readonly maxBlockSize: number;
  readonly maxBlockSystemFee: BN;
  readonly maxTransactionsPerBlock: number;
  readonly nativeUpdateHistory: { readonly [key: string]: readonly number[] };
}

export interface VMProtocolSettingsIn {
  readonly magic?: number;
  readonly addressVersion?: number;
  readonly standbyCommittee?: readonly string[];
  readonly committeeMembersCount?: number;
  readonly validatorsCount?: number;
  readonly seedList?: readonly string[];
  readonly millisecondsPerBlock?: number;
  readonly memoryPoolMaxTransactions?: number;
  readonly maxTraceableBlocks?: number;
  readonly maxTransactionsPerBlock?: number;
  readonly nativeUpdateHistory?: { readonly [key: string]: readonly number[] };
}

export interface VMProtocolSettingsReturn {
  readonly magic: number;
  readonly addressVersion: number;
  readonly standbyCommittee: readonly string[];
  readonly committeeMembersCount: number;
  readonly validatorsCount: number;
  readonly seedList: readonly string[];
  readonly millisecondsPerBlock: number;
  readonly memoryPoolMaxTransactions: number;
  readonly maxTraceableBlocks: number;
  readonly maxTransactionsPerBlock: number;
  readonly nativeUpdateHistory: { readonly [key: string]: readonly number[] };
}

export interface NetworkSettings {
  readonly seeds: readonly string[];
}

export interface Settings extends BlockchainSettings {}
