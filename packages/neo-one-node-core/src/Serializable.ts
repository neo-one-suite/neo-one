import { BinaryReader, SerializableWire } from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import { Block } from './Block';
import { Header } from './Header';
import { ExtensiblePayload } from './payload';
import { Signers } from './Signers';
import { Transaction } from './transaction';
import { Verifiable } from './Verifiable';

export { SerializeWire, SerializableWire, createSerializeWire } from '@neo-one/client-common';

// TODO: may need to remove signers from here? And everywhere?
export type SerializableContainerType = 'Block' | 'Header' | 'Signers' | 'Transaction' | 'ExtensiblePayload';

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
    case 'Header':
      return Header.deserializeWire({ buffer, context });
    case 'Transaction':
      return Transaction.deserializeWire({ buffer, context });
    case 'ExtensiblePayload':
      return ExtensiblePayload.deserializeWire({ buffer, context });
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

export interface SerializeJSONContext {
  readonly addressVersion: number;
  readonly messageMagic: number;
}

export type SerializeJSON<TJSON> = (context: SerializeJSONContext) => TJSON | Promise<TJSON>;

export interface SerializableJSON<TJSON> {
  readonly serializeJSON: SerializeJSON<TJSON>;
}
