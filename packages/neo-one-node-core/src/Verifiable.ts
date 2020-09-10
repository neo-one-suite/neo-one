import { SerializableWire, UInt160 } from '@neo-one/client-common';
import { BlockchainStorage } from './Storage';
import { VM } from './vm';
import { Witness } from './Witness';

export interface Verifiable {
  readonly getScriptHashesForVerifying: (
    storage: BlockchainStorage,
  ) => Promise<readonly UInt160[]> | readonly UInt160[];
  readonly witnesses: readonly Witness[];
}

export interface VerifyResult {
  readonly gas: number;
  readonly result: boolean;
}

export type VerifyWitnesses = (
  vm: VM,
  verifiable: Verifiable & SerializableWire,
  storage: BlockchainStorage,
  gasIn: number,
) => Promise<boolean>;
