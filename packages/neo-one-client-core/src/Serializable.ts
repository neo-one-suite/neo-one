import { Action } from './action';
import { Asset } from './Asset';
import { ECPoint, UInt160 } from './common';
import { Contract } from './Contract';
import { InvocationResult } from './invocationResult';
import { FeeContext, Input, InvocationTransaction, TransactionBase } from './transaction';
import { TransactionData } from './TransactionData';
import { BinaryReader, BinaryWriter } from './utils';

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

export type SerializeWire = () => Buffer;
export type DeserializeWireBase<T> = (options: DeserializeWireBaseOptions) => T;
export type DeserializeWire<T> = (options: DeserializeWireOptions) => T;

// tslint:disable-next-line no-unused
export interface SerializableWire<T> {
  readonly serializeWireBase: (writer: BinaryWriter) => void;
  readonly serializeWire: SerializeWire;
}

export const createSerializeWire = (serializeWireBase: (writer: BinaryWriter) => void): SerializeWire => () => {
  const writer = new BinaryWriter();
  serializeWireBase(writer);

  return writer.toBuffer();
};

export function createDeserializeWire<T>(deserializeWireBase: DeserializeWireBase<T>): DeserializeWire<T> {
  return (options) =>
    deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
}

export interface SerializableInvocationData {
  readonly asset: Asset | undefined;
  readonly contracts: ReadonlyArray<Contract>;
  readonly deletedContractHashes: ReadonlyArray<UInt160>;
  readonly migratedContractHashes: ReadonlyArray<[UInt160, UInt160]>;
  readonly voteUpdates: ReadonlyArray<[UInt160, ReadonlyArray<ECPoint>]>;
  readonly result: InvocationResult;
  readonly actions: ReadonlyArray<Action>;
}

export interface SerializeJSONContext {
  readonly addressVersion: number;
  readonly feeContext: FeeContext;
  readonly tryGetInvocationData: (
    transaction: InvocationTransaction,
  ) => Promise<SerializableInvocationData | undefined>;
  readonly tryGetTransactionData: (transaction: TransactionBase) => Promise<TransactionData | undefined>;
  readonly getUnclaimed: (hash: UInt160) => Promise<ReadonlyArray<Input>>;
  readonly getUnspent: (hash: UInt160) => Promise<ReadonlyArray<Input>>;
}

export type SerializeJSON<TJSON> = (context: SerializeJSONContext) => TJSON | Promise<TJSON>;

export interface SerializableJSON<TJSON> {
  readonly serializeJSON: SerializeJSON<TJSON>;
}
