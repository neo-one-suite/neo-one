import { UInt160, UInt256 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Header } from './Header';
import { TrimmedBlock } from './TrimmedBlock';
import { Witness } from './Witness';

export interface SnapshotMethods {
  readonly tryGetBlock: (hash: UInt256) => Promise<TrimmedBlock | undefined>;
  readonly tryGetHeader: (hash: UInt256) => Promise<Header | undefined>;
  readonly tryGetContract: (hash: UInt160) => Promise<Contract | undefined>;
  readonly tryGetStorage: (key: StorageKey) => Promise<StorageItem | undefined>;
}

export interface Verifiable {
  readonly getScriptHashesForVerifying: (snapshot: SnapshotMethods) => Promise<readonly UInt160[]>;
  readonly witnesses: readonly Witness[];
}

export interface VerifyResult {
  readonly gas: number;
  readonly result: boolean;
}

export type VerifyWitnesses = (verifiable: Verifiable, snapshot: SnapshotMethods, gasIn: BN) => Promise<boolean>;
