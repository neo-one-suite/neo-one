/* @flow */
import type { Action } from './action';
import type Asset from './Asset';
import type Contract from './Contract';
import { BinaryReader, BinaryWriter } from './utils';
import type { InvocationResult } from './invocationResult';
import type { FeeContext, InvocationTransaction } from './transaction';

export type DeserializeWireContext = {|
  messageMagic: number,
|};

export type DeserializeWireBaseOptions = {|
  context: DeserializeWireContext,
  reader: BinaryReader,
|};

export type DeserializeWireOptions = {|
  context: DeserializeWireContext,
  buffer: Buffer,
|};

export type SerializeWire = () => Buffer;
export type DeserializeWireBase<T> = (options: DeserializeWireBaseOptions) => T;
export type DeserializeWire<T> = (options: DeserializeWireOptions) => T;

export interface SerializableWire<T> {
  +serializeWireBase: (writer: BinaryWriter) => void;
  +serializeWire: SerializeWire;
  static +deserializeWireBase: DeserializeWireBase<T>;
  static +deserializeWire: DeserializeWire<T>;
}

export const createSerializeWire = (
  serializeWireBase: (writer: BinaryWriter) => void,
): SerializeWire => () => {
  const writer = new BinaryWriter();
  serializeWireBase(writer);
  return writer.toBuffer();
};

export function createDeserializeWire<T>(
  deserializeWireBase: DeserializeWireBase<T>,
): DeserializeWire<T> {
  return (options: DeserializeWireOptions) =>
    deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
}

export type InvocationData = {|
  asset: ?Asset,
  contracts: Array<Contract>,
  actions: Array<Action>,
  result: InvocationResult,
|};
export type SerializeJSONContext = {|
  addressVersion: number,
  feeContext: FeeContext,
  getInvocationData: (
    transaction: InvocationTransaction,
  ) => Promise<InvocationData>,
|};

export type SerializeJSON<TJSON> = (
  context: SerializeJSONContext,
) => TJSON | Promise<TJSON>;

export interface SerializableJSON<TJSON> {
  +serializeJSON: SerializeJSON<TJSON>;
}
