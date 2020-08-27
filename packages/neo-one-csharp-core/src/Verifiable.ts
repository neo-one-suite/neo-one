import { UInt160, UInt256 } from '@neo-one/client-common';
import { Header } from './Header';
import { StorageItem } from './StorageItem';
import { StorageKey } from './StorageKey';
import { TrimmedBlock } from './TrimmedBlock';
import { Witness } from './Witness';

export interface StorageMethods {
  readonly tryGetBlock: (hash: UInt256) => Promise<TrimmedBlock | undefined>;
  readonly tryGetHeader: (hash: UInt256) => Promise<Header | undefined>;
  readonly tryGetContract: (hash: UInt160) => Promise<ContractState | undefined>;
  readonly tryGetStorage: (key: StorageKey) => Promise<StorageItem | undefined>;
}

export interface Verifiable {
  readonly getScriptHashesForVerifying: (snapshot: StorageMethods) => Promise<readonly UInt160[]>;
  readonly witnesses: readonly Witness[];
}

export interface VerifyResult {
  readonly gas: number;
  readonly result: boolean;
}

export type VerifyWitnesses = (verifiable: Verifiable, storage: StorageMethods, gasIn: number) => Promise<boolean>;
