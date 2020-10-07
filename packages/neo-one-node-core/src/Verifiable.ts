import { SerializableWire, UInt160 } from '@neo-one/client-common';
import { NativeContainer } from './Native';
import { BlockchainStorage } from './Storage';
import { VM } from './vm';
import { Witness } from './Witness';

export interface Verifiable {
  readonly getScriptHashesForVerifying: (context: {
    readonly storage: BlockchainStorage;
    readonly native: NativeContainer;
  }) => Promise<readonly UInt160[]> | readonly UInt160[];
  readonly witnesses: readonly Witness[];
}

export interface ExecuteScriptResult {
  readonly gas: number;
  readonly result: boolean;
}

export type VerifyWitnesses = (
  vm: VM,
  verifiable: Verifiable & SerializableWire,
  storage: BlockchainStorage,
  native: NativeContainer,
  gasIn: number,
) => Promise<boolean>;

export interface VerifyOptions {
  readonly vm: VM;
  readonly storage: BlockchainStorage;
  readonly native: NativeContainer;
  readonly verifyWitnesses: VerifyWitnesses;
}

/* I think all of this might be a useless abstraction of blockchain properties. */
