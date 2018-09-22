import { ECPoint, UInt160 } from '@neo-one/client-common';
import { Action } from './action';
import { Asset } from './Asset';
import { Contract } from './Contract';
import { InvocationResult } from './invocationResult';
import { FeeContext, Input, InvocationTransaction, Transaction } from './transaction';
import { TransactionData } from './TransactionData';
import { BinaryReader } from './utils';

export { SerializeWire, SerializableWire, createSerializeWire } from '@neo-one/client-common';

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
  readonly tryGetTransactionData: (transaction: Transaction) => Promise<TransactionData | undefined>;
  readonly getUnclaimed: (hash: UInt160) => Promise<ReadonlyArray<Input>>;
  readonly getUnspent: (hash: UInt160) => Promise<ReadonlyArray<Input>>;
}

export type SerializeJSON<TJSON> = (context: SerializeJSONContext) => TJSON | Promise<TJSON>;

export interface SerializableJSON<TJSON> {
  readonly serializeJSON: SerializeJSON<TJSON>;
}
