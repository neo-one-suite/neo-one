/* @flow */
import type BN from 'bn.js';
import BaseState from './BaseState';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from './Serializable';
import { type UInt256 } from './common';

import utils, { type BinaryWriter, BinaryReader, IOHelper } from './utils';

export type TransactionDataAdd = {|
  version?: number,
  hash: UInt256,
  blockHash: UInt256,
  startHeight: number,
  index: number,
  globalIndex: BN,
  endHeights?: { [index: number]: number },
  claimed?: { [index: number]: boolean },
|};
export type TransactionDataUpdate = {|
  endHeights?: { [index: number]: number },
  claimed?: { [index: number]: boolean },
|};
export type TransactionDataKey = {|
  hash: UInt256,
|};

export default class TransactionData extends BaseState
  implements SerializableWire<TransactionData> {
  hash: UInt256;
  blockHash: UInt256;
  startHeight: number;
  index: number;
  globalIndex: BN;
  endHeights: { [index: number]: number };
  claimed: { [index: number]: boolean };

  __size: () => number;

  constructor({
    version,
    hash,
    blockHash,
    startHeight,
    index,
    globalIndex,
    endHeights,
    claimed,
  }: TransactionDataAdd) {
    super({ version });
    this.hash = hash;
    this.blockHash = blockHash;
    this.startHeight = startHeight;
    this.index = index;
    this.globalIndex = globalIndex;
    this.endHeights = endHeights || {};
    this.claimed = claimed || {};
    this.__size = utils.lazy(
      () =>
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfUInt256 +
        IOHelper.sizeOfUInt32LE +
        IOHelper.sizeOfObject(
          this.endHeights,
          () => IOHelper.sizeOfUInt32LE + IOHelper.sizeOfUInt32LE,
        ) +
        IOHelper.sizeOfObject(
          this.claimed,
          () => IOHelper.sizeOfUInt32LE + IOHelper.sizeOfBoolean,
        ),
    );
  }

  get size(): number {
    return this.__size();
  }

  update({ endHeights, claimed }: TransactionDataUpdate): TransactionData {
    return new this.constructor({
      version: this.version,
      hash: this.hash,
      blockHash: this.blockHash,
      startHeight: this.startHeight,
      index: this.index,
      globalIndex: this.globalIndex,
      endHeights: endHeights == null ? this.endHeights : endHeights,
      claimed: claimed == null ? this.claimed : claimed,
    });
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt256(this.hash);
    writer.writeUInt256(this.blockHash);
    writer.writeUInt32LE(this.startHeight);
    writer.writeUInt32LE(this.index);
    writer.writeUInt64LE(this.globalIndex);
    writer.writeObject(this.endHeights, (key, value) => {
      writer.writeUInt32LE(key);
      writer.writeUInt32LE(value);
    });
    writer.writeObject(this.claimed, (key, value) => {
      writer.writeUInt32LE(key);
      writer.writeBoolean(value);
    });
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): TransactionData {
    const version = reader.readUInt8();
    const hash = reader.readUInt256();
    const blockHash = reader.readUInt256();
    const startHeight = reader.readUInt32LE();
    const index = reader.readUInt32LE();
    const globalIndex = reader.readUInt64LE();
    const endHeights = reader.readObject(() => {
      const key = reader.readUInt32LE();
      const value = reader.readUInt32LE();
      return { key, value };
    });
    const claimed = reader.readObject(() => {
      const key = reader.readUInt32LE();
      const value = reader.readBoolean();
      return { key, value };
    });

    return new this({
      version,
      hash,
      blockHash,
      startHeight,
      index,
      globalIndex,
      endHeights,
      claimed,
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
