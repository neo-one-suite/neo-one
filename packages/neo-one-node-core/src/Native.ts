import { common, ECPoint, UInt160 } from '@neo-one/client-common';
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
}

export interface GASContract extends NEP5NativeContract {}

export interface PolicyContract extends NativeContract {
  readonly getMaxTransactionsPerBlock: (storage: NativeContractStorageContext) => Promise<number>;
  readonly getMaxBlockSize: (storage: NativeContractStorageContext) => Promise<number>;
  readonly getMaxBlockSystemFee: (storage: NativeContractStorageContext) => Promise<number>;
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

export const NativeHashes = {
  GAS: common.hexToUInt160('bcaf41d684c7d4ad6ee0d99da9707b9d1f0c8e66'),
  NEO: common.hexToUInt160('25059ecb4878d3a875f91c51ceded330d4575fde'),
  Policy: common.hexToUInt160('e9ff4ca7cc252e1dfddb26315869cd79505906ce'),
};
