import { ECPoint, UInt160 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { ReadFindStorage } from './Storage';
import { StorageItem } from './StorageItem';
import { StorageKey } from './StorageKey';

export interface NativeContractStorageContext {
  readonly storages: ReadFindStorage<StorageKey, StorageItem>;
}

export interface NativeContract {
  readonly id: number;
  readonly name: string;
}

export interface NEP5NativeContract extends NativeContract {
  readonly symbol: string;
  readonly decimals: number;

  readonly totalSupply: (storage: NativeContractStorageContext) => Promise<BN>;
  readonly balanceOf: (storage: NativeContractStorageContext, account: UInt160) => Promise<BN>;
}

export interface GASContract extends NEP5NativeContract {}

export interface PolicyContract extends NativeContract {
  readonly getMaxTransactionsPerBlock: (storage: NativeContractStorageContext) => Promise<number>;
  readonly getMaxBlockSize: (storage: NativeContractStorageContext) => Promise<number>;
  readonly getMaxBlockSystemFee: (storage: NativeContractStorageContext) => Promise<BN>;
  readonly getFeePerByte: (storage: NativeContractStorageContext) => Promise<number>;
  readonly getBlockedAccounts: (storage: NativeContractStorageContext) => Promise<readonly UInt160[]>;
}

export interface Candidate {
  readonly publicKey: ECPoint;
  readonly votes: BN;
}

export interface NEOContract extends NEP5NativeContract {
  readonly totalAmount: BN;
  readonly effectiveVoterTurnout: number;

  readonly totalSupply: () => Promise<BN>;
  readonly getCandidates: (storage: NativeContractStorageContext) => Promise<readonly Candidate[]>;
  readonly getValidators: (storage: NativeContractStorageContext) => Promise<readonly ECPoint[]>;
  readonly getCommittee: (storage: NativeContractStorageContext) => Promise<readonly ECPoint[]>;
  readonly getCommitteeAddress: (storage: NativeContractStorageContext) => Promise<UInt160>;
  readonly unclaimedGas: (storage: NativeContractStorageContext, account: UInt160, end: number) => Promise<BN>;
  readonly getNextBlockValidators: (storage: NativeContractStorageContext) => Promise<readonly ECPoint[]>;
}

export interface NativeContainer {
  readonly GAS: GASContract;
  readonly NEO: NEOContract;
  readonly Policy: PolicyContract;
}
