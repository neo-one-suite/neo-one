import { ECPoint, UInt160 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { ReadFindStorage } from './Storage';
import { StorageItem } from './StorageItem';
import { StorageKey } from './StorageKey';
import { ContractState } from './ContractState';
import { OracleRequest } from './OracleRequest';
import { DesignationRole } from './DesignationRole';

export type OracleRequestResults = ReadonlyArray<readonly [BN, OracleRequest]>;

export interface NativeContractStorageContext {
  readonly storages: ReadFindStorage<StorageKey, StorageItem>;
}

export interface NativeContract {
  readonly id: number;
  readonly name: string;
}

export interface NEP17NativeContract extends NativeContract {
  readonly symbol: string;
  readonly decimals: number;

  readonly totalSupply: (storage: NativeContractStorageContext) => Promise<BN>;
  readonly balanceOf: (storage: NativeContractStorageContext, account: UInt160) => Promise<BN>;
}

export interface GASContract extends NEP17NativeContract {}

export interface PolicyContract extends NativeContract {
  readonly getMaxTransactionsPerBlock: (storage: NativeContractStorageContext) => Promise<number>;
  readonly getMaxBlockSize: (storage: NativeContractStorageContext) => Promise<number>;
  readonly getMaxBlockSystemFee: (storage: NativeContractStorageContext) => Promise<BN>;
  readonly getFeePerByte: (storage: NativeContractStorageContext) => Promise<BN>;
  readonly getExecFeeFactor: (storage: NativeContractStorageContext) => Promise<number>;
  readonly getStoragePrice: (storage: NativeContractStorageContext) => Promise<number>;
  readonly isBlocked: (storage: NativeContractStorageContext, account: UInt160) => Promise<boolean>;
}

export interface Candidate {
  readonly publicKey: ECPoint;
  readonly votes: BN;
}

export interface NEOContract extends NEP17NativeContract {
  readonly totalAmount: BN;
  readonly effectiveVoterTurnout: number;

  readonly totalSupply: () => Promise<BN>;
  readonly getCandidates: (storage: NativeContractStorageContext) => Promise<readonly Candidate[]>;
  readonly getCommittee: (storage: NativeContractStorageContext) => Promise<readonly ECPoint[]>;
  readonly getCommitteeAddress: (storage: NativeContractStorageContext) => Promise<UInt160>;
  readonly unclaimedGas: (storage: NativeContractStorageContext, account: UInt160, end: number) => Promise<BN>;
  readonly getNextBlockValidators: (storage: NativeContractStorageContext) => Promise<readonly ECPoint[]>;
}

export interface ManagementContract extends NativeContract {
  readonly getContract: (storage: NativeContractStorageContext, hash: UInt160) => Promise<ContractState>;
  readonly listContracts: (storage: NativeContractStorageContext) => Promise<readonly ContractState[]>;
}

export interface DesignationContract extends NativeContract {
  readonly getDesignatedByRole: (
    storage: NativeContractStorageContext,
    role: DesignationRole,
    height: number,
    index: number,
  ) => Promise<readonly ECPoint[]>;
}

export interface OracleContract extends NativeContract {
  readonly getRequest: (storage: NativeContractStorageContext, id: BN) => Promise<OracleRequest>;
  readonly getRequests: (storage: NativeContractStorageContext) => Promise<OracleRequestResults>;
  readonly getRequestsByUrl: (storage: NativeContractStorageContext, url: string) => Promise<readonly OracleRequest[]>;
}

export interface NativeContainer {
  readonly GAS: GASContract;
  readonly NEO: NEOContract;
  readonly Policy: PolicyContract;
  readonly Management: ManagementContract;
  readonly Designation: DesignationContract;
  readonly Oracle: OracleContract;
}
