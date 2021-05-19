import { ECPoint, NativeContractJSON, UInt160, UInt256 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Block } from './Block';
import { ContractState } from './ContractState';
import { DesignationRole } from './DesignationRole';
import { Header } from './Header';
import { ContractManifest } from './manifest';
import { NefFile } from './NefFile';
import { OracleRequest } from './OracleRequest';
import { ReadFindStorage } from './Storage';
import { StorageItem } from './StorageItem';
import { StorageKey } from './StorageKey';
import { Transaction } from './transaction/Transaction';
import { TransactionState } from './transaction/TransactionState';
import { TrimmedBlock } from './TrimmedBlock';

export type OracleRequestResults = ReadonlyArray<readonly [BN, OracleRequest]>;

export interface NativeContractStorageContext {
  readonly storages: ReadFindStorage<StorageKey, StorageItem>;
}

export interface NativeContract {
  readonly id: number;
  readonly name: string;
  readonly nef: NefFile;
  readonly hash: UInt160;
  readonly manifest: ContractManifest;
  readonly serializeJSON: () => NativeContractJSON;
}

export interface FungibleToken extends NativeContract {
  readonly symbol: string;
  readonly decimals: number;

  readonly totalSupply: (storage: NativeContractStorageContext) => Promise<BN>;
  readonly balanceOf: (storage: NativeContractStorageContext, account: UInt160) => Promise<BN>;
}

export interface GASContract extends FungibleToken {}

export interface PolicyContract extends NativeContract {
  readonly getFeePerByte: (storage: NativeContractStorageContext) => Promise<BN>;
  readonly getExecFeeFactor: (storage: NativeContractStorageContext) => Promise<number>;
  readonly getStoragePrice: (storage: NativeContractStorageContext) => Promise<number>;
  readonly isBlocked: (storage: NativeContractStorageContext, account: UInt160) => Promise<boolean>;
}

export interface Candidate {
  readonly publicKey: ECPoint;
  readonly votes: BN;
}

export interface NEOContract extends FungibleToken {
  readonly totalAmount: BN;
  readonly effectiveVoterTurnout: number;

  readonly totalSupply: () => Promise<BN>;
  readonly getCandidates: (storage: NativeContractStorageContext) => Promise<readonly Candidate[]>;
  readonly getCommittee: (storage: NativeContractStorageContext) => Promise<readonly ECPoint[]>;
  readonly getCommitteeAddress: (storage: NativeContractStorageContext) => Promise<UInt160>;
  readonly unclaimedGas: (storage: NativeContractStorageContext, account: UInt160, end: number) => Promise<BN>;
  readonly getNextBlockValidators: (storage: NativeContractStorageContext) => Promise<readonly ECPoint[]>;
  readonly computeNextBlockValidators: (storage: NativeContractStorageContext) => Promise<readonly ECPoint[]>;
  readonly getRegisterPrice: (storage: NativeContractStorageContext) => Promise<BN>;
}

export interface ContractManagement extends NativeContract {
  readonly getContract: (storage: NativeContractStorageContext, hash: UInt160) => Promise<ContractState | undefined>;
  readonly listContracts: (storage: NativeContractStorageContext) => Promise<readonly ContractState[]>;
}

export interface RoleManagement extends NativeContract {
  readonly getDesignatedByRole: (
    storage: NativeContractStorageContext,
    role: DesignationRole,
    height: number,
    index: number,
  ) => Promise<readonly ECPoint[]>;
}

export interface OracleContract extends NativeContract {
  readonly getPrice: (storage: NativeContractStorageContext) => Promise<BN>;
  readonly getRequest: (storage: NativeContractStorageContext, id: BN) => Promise<OracleRequest | undefined>;
  readonly getRequests: (storage: NativeContractStorageContext) => Promise<OracleRequestResults>;
  readonly getRequestsByUrl: (storage: NativeContractStorageContext, url: string) => Promise<readonly OracleRequest[]>;
}

export interface LedgerContract extends NativeContract {
  readonly isInitialized: (storage: NativeContractStorageContext) => Promise<boolean>;
  readonly getBlockHash: (storage: NativeContractStorageContext, index: number) => Promise<UInt256 | undefined>;
  readonly currentHash: (storage: NativeContractStorageContext) => Promise<UInt256>;
  readonly currentIndex: (storage: NativeContractStorageContext) => Promise<number>;
  readonly containsBlock: (storage: NativeContractStorageContext, hash: UInt256) => Promise<boolean>;
  readonly containsTransaction: (storage: NativeContractStorageContext, hash: UInt256) => Promise<boolean>;
  readonly getTrimmedBlock: (storage: NativeContractStorageContext, hash: UInt256) => Promise<TrimmedBlock | undefined>;
  readonly getBlock: (
    storage: NativeContractStorageContext,
    hashOrIndex: UInt256 | number,
  ) => Promise<Block | undefined>;
  readonly getHeader: (
    storage: NativeContractStorageContext,
    hashOrIndex: UInt256 | number,
  ) => Promise<Header | undefined>;
  readonly getTransactionState: (
    storage: NativeContractStorageContext,
    hash: UInt256,
  ) => Promise<TransactionState | undefined>;
  readonly getTransaction: (storage: NativeContractStorageContext, hash: UInt256) => Promise<Transaction | undefined>;
}

export interface CryptoLib {}

export interface StdLib {}

export interface NativeContainer {
  readonly ContractManagement: ContractManagement;
  readonly Ledger: LedgerContract;
  readonly NEO: NEOContract;
  readonly GAS: GASContract;
  readonly Policy: PolicyContract;
  readonly RoleManagement: RoleManagement;
  readonly Oracle: OracleContract;
  readonly CryptoLib: CryptoLib;
  readonly StdLib: StdLib;
  readonly nativeHashes: readonly UInt160[];
  readonly nativeContracts: readonly NativeContract[];
  readonly isNative: (hash: UInt160) => boolean;
}
