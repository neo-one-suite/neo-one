// import { ECPoint, UInt160 } from '@neo-one/client-common';
// import { Action } from './action';
// import { Asset } from './Asset';
// import { Contract } from './Contract';
// import { InvocationResult } from './invocationResult';
// import { StorageChange } from './storageChange';
import { SerializableWire } from '@neo-one/client-common';
import { BinaryReader } from './utils';

export { SerializeWire, SerializableWire, createSerializeWire } from '@neo-one/client-common';

export type SerializableContainerType = 'Block' | 'Signers' | 'Transaction';

export interface SerializableContainer extends SerializableWire {
  readonly type: SerializableContainerType;
}

export interface SerializedScriptContainer {
  readonly type: SerializableContainerType;
  readonly buffer: Buffer;
}

export const serializeScriptContainer = (item: SerializableContainer): SerializedScriptContainer => ({
  buffer: item.serializeWire(),
  type: item.type,
});

export interface DeserializeWireContext {
  readonly messageMagic: number;
}

export interface DeserializeWireBaseOptions {
  readonly context: DeserializeWireContext;
  readonly reader: BinaryReader;
}

export interface DeserializeWireOptions {
  readonly context: DeserializeWireContext;
  readonly buffer: Buffer;
}

export type DeserializeWireBase<T> = (options: DeserializeWireBaseOptions) => T;
export type DeserializeWire<T> = (options: DeserializeWireOptions) => T;

export function createDeserializeWire<T>(deserializeWireBase: DeserializeWireBase<T>): DeserializeWire<T> {
  return (options) =>
    deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
}

// export interface SerializableInvocationData {
//   readonly asset: Asset | undefined;
//   readonly contracts: readonly Contract[];
//   readonly deletedContractHashes: readonly UInt160[];
//   readonly migratedContractHashes: ReadonlyArray<readonly [UInt160, UInt160]>;
//   readonly voteUpdates: ReadonlyArray<readonly [UInt160, ReadonlyArray<ECPoint>]>;
//   readonly result: InvocationResult;
//   readonly actions: readonly Action[];
//   readonly storageChanges: readonly StorageChange[];
// }

// TODO: what did all of these `TransactionData` helpers do? How should we re implement?
export interface SerializeJSONContext {
  readonly addressVersion: number;
}

export type SerializeJSON<TJSON> = (context: SerializeJSONContext) => TJSON | Promise<TJSON>;

export interface SerializableJSON<TJSON> {
  readonly serializeJSON: SerializeJSON<TJSON>;
}
