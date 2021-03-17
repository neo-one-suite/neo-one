import { common, UInt160 } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { HeaderCache } from './HeaderCache';
import { NativeContainer } from './Native';
import { SerializableContainer } from './Serializable';
import { BlockchainStorage } from './Storage';
import { SnapshotName, VM } from './vm';
import { Witness } from './Witness';

export const maxVerificationGas = common.fixed8FromDecimal('0.5');

export interface GetScriptHashesContext {
  readonly storage: BlockchainStorage;
  readonly native: NativeContainer;
  readonly headerCache: HeaderCache;
}

export interface Verifiable {
  readonly getScriptHashesForVerifying: (
    context: GetScriptHashesContext,
  ) => Promise<readonly UInt160[]> | readonly UInt160[];
  readonly witnesses: readonly Witness[];
}

export interface ExecuteScriptResult {
  readonly gas: BN;
  readonly result: boolean;
}

export interface VerifyWitnessesOptions {
  readonly vm: VM;
  readonly verifiable: SerializableContainer;
  readonly storage: BlockchainStorage;
  readonly native: NativeContainer;
  readonly headerCache: HeaderCache;
  readonly gas: BN;
  readonly snapshot?: SnapshotName;
}

export type VerifyWitnesses = (options: VerifyWitnessesOptions) => Promise<boolean>;

export interface VerifyWitnessOptions extends VerifyWitnessesOptions {
  readonly hash: UInt160;
  readonly witness: Witness;
}

export type VerifyWitness = (options: VerifyWitnessOptions) => Promise<ExecuteScriptResult>;

export interface VerifyOptions {
  readonly height: number;
  readonly vm: VM;
  readonly storage: BlockchainStorage;
  readonly native: NativeContainer;
  readonly headerCache: HeaderCache;
  readonly verifyWitnesses: VerifyWitnesses;
  readonly verifyWitness: VerifyWitness;
  readonly isExtensibleWitnessWhiteListed: (address: UInt160) => boolean;
}

/* I think all of this might be a useless abstraction of blockchain properties. */
