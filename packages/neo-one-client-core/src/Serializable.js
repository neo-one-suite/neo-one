/* @flow */
import type { Action } from './action';
import type Asset from './Asset';
import type Contract from './Contract';
import { BinaryReader, BinaryWriter } from './utils';
import type { ECPoint, UInt160 } from './common';
import type { InvocationResult } from './invocationResult';
import type { FeeContext, Input, InvocationTransaction } from './transaction';

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

// eslint-disable-next-line
export interface SerializableWire<T> {
  +serializeWireBase: (writer: BinaryWriter) => void;
  +serializeWire: SerializeWire;
  // static +deserializeWireBase: DeserializeWireBase<T>;
  // static +deserializeWire: DeserializeWire<T>;
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
  deletedContractHashes: Array<UInt160>,
  migratedContractHashes: Array<[UInt160, UInt160]>,
  voteUpdates: Array<[UInt160, Array<ECPoint>]>,
  result: InvocationResult,
  actions: Array<Action>,
|};
export type SerializeJSONContext = {|
  addressVersion: number,
  feeContext: FeeContext,
  tryGetInvocationData: (
    transaction: InvocationTransaction,
  ) => Promise<?InvocationData>,
  getUnclaimed: (hash: UInt160) => Promise<Array<Input>>,
  getUnspent: (hash: UInt160) => Promise<Array<Input>>,
|};

export type SerializeJSON<TJSON> = (
  context: SerializeJSONContext,
) => TJSON | Promise<TJSON>;

export interface SerializableJSON<TJSON> {
  +serializeJSON: SerializeJSON<TJSON>;
}
