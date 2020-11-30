// import { ECPoint, UInt160 } from '@neo-one/client-common';
// import { Action } from './action';
// import { Asset } from './Asset';
// import { Contract } from './Contract';
// import { InvocationResult } from './invocationResult';
// import { StorageChange } from './storageChange';
import { SerializableWire } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import { Block } from './Block';
import { ConsensusPayload } from './payload';
import { Signers } from './Signers';
import { Transaction } from './transaction';
import { BinaryReader } from './utils';
import { Verifiable } from './Verifiable';

export { SerializeWire, SerializableWire, createSerializeWire } from '@neo-one/client-common';

export type SerializableContainerType = 'Block' | 'Signers' | 'Transaction' | 'ConsensusPayload';

export interface SerializableContainer extends SerializableWire, Verifiable {
  readonly type: SerializableContainerType;
}

export interface SerializedScriptContainer {
  readonly type: SerializableContainerType;
  readonly buffer: Buffer;
}

export const deserializeScriptContainer = (
  item: SerializedScriptContainer,
  context: DeserializeWireContext,
): SerializableWire => {
  const buffer = item.buffer;
  switch (item.type) {
    case 'Block':
      return Block.deserializeWire({ buffer, context });
    case 'Transaction':
      return Transaction.deserializeWire({ buffer, context });
    case 'ConsensusPayload':
      return ConsensusPayload.deserializeWire({ buffer, context });
    case 'Signers':
      return Signers.deserializeWire({ buffer, context });
    default:
      utils.assertNever(item.type);
      throw new Error('For TS');
  }
};

export const serializeScriptContainer = (item: SerializableContainer): SerializedScriptContainer => ({
  buffer: item.serializeWire(),
  type: item.type,
});

export interface DeserializeWireContext {
  readonly messageMagic: number;
  readonly validatorsCount: number;
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
