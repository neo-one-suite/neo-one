import { ECPoint } from '@neo-one/client-common';
import { Block } from './Block';
import { BlockchainStorage } from './Storage';

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
}

export interface PolicySettings {
  readonly getMaxBlockSize: (storages: BlockchainStorage['storages']) => Promise<number>;
  readonly getMaxTransactionsPerBlock: (storages: BlockchainStorage['storages']) => Promise<number>;
  readonly getMaxBlockSystemFee: (storages: BlockchainStorage['storages']) => Promise<number>;
  readonly getValidators: (storages: BlockchainStorage['storages']) => Promise<number>;
}

export interface NetworkSettings {
  readonly seeds: readonly string[];
}

export interface Settings extends BlockchainSettings {}
