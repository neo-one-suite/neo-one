import { Action } from './action';
import { Asset } from './Asset';
import { Contract } from './Contract';
import { BinaryReader, BinaryWriter } from './utils';
import { ECPoint, UInt160 } from './common';
import { InvocationResult } from './invocationResult';
import {
  FeeContext,
  Input,
  InvocationTransaction,
  TransactionBase,
} from './transaction';
import { TransactionData } from './TransactionData';

export interface DeserializeWireContext {
  messageMagic: number;
}

export interface DeserializeWireBaseOptions {
  context: DeserializeWireContext;
  reader: BinaryReader;
}

export interface DeserializeWireOptions {
  context: DeserializeWireContext;
  buffer: Buffer;
}

export type SerializeWire = () => Buffer;
export type DeserializeWireBase<T> = (options: DeserializeWireBaseOptions) => T;
export type DeserializeWire<T> = (options: DeserializeWireOptions) => T;

export interface SerializableWire<T> {
  readonly serializeWireBase: (writer: BinaryWriter) => void;
  readonly serializeWire: SerializeWire;
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

export interface SerializableInvocationData {
  asset: Asset | null;
  contracts: Contract[];
  deletedContractHashes: UInt160[];
  migratedContractHashes: Array<[UInt160, UInt160]>;
  voteUpdates: Array<[UInt160, ECPoint[]]>;
  result: InvocationResult;
  actions: Action[];
}

export interface SerializeJSONContext {
  addressVersion: number;
  feeContext: FeeContext;
  tryGetInvocationData: (
    transaction: InvocationTransaction,
  ) => Promise<SerializableInvocationData | null>;
  tryGetTransactionData: (
    transaction: TransactionBase<any, any>,
  ) => Promise<TransactionData | null>;
  getUnclaimed: (hash: UInt160) => Promise<Input[]>;
  getUnspent: (hash: UInt160) => Promise<Input[]>;
}

export type SerializeJSON<TJSON> = (
  context: SerializeJSONContext,
) => TJSON | Promise<TJSON>;

export interface SerializableJSON<TJSON> {
  readonly serializeJSON: SerializeJSON<TJSON>;
}
