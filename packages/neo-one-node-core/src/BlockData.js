/* @flow */
import type BN from 'bn.js';
import {
  type BinaryWriter,
  type Equatable,
  type Equals,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  type UInt256,
  type UInt256Hex,
  BinaryReader,
  IOHelper,
  common,
  createSerializeWire,
  utils,
} from '@neo-one/client-core';

export type BlockDataKey = {|
  hash: UInt256,
|};
export type BlockDataAdd = {|
  hash: UInt256,
  lastGlobalTransactionIndex: BN,
  lastGlobalActionIndex: BN,
  systemFee: BN,
|};

export default class BlockData
  implements Equatable, SerializableWire<BlockData> {
  hash: UInt256;
  hashHex: UInt256Hex;
  lastGlobalTransactionIndex: BN;
  lastGlobalActionIndex: BN;
  systemFee: BN;

  __size: () => number;

  constructor({
    hash,
    lastGlobalTransactionIndex,
    lastGlobalActionIndex,
    systemFee,
  }: BlockDataAdd) {
    this.hash = hash;
    this.hashHex = common.uInt256ToHex(hash);
    this.lastGlobalTransactionIndex = lastGlobalTransactionIndex;
    this.lastGlobalActionIndex = lastGlobalActionIndex;
    this.systemFee = systemFee;
    this.__size = utils.lazy(
      () => IOHelper.sizeOfUInt256 + IOHelper.sizeOfFixed8,
    );
  }

  get size(): number {
    return this.__size();
  }

  equals: Equals = utils.equals(BlockData, (other) =>
    common.uInt256Equal(this.hash, other.hash),
  );

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hash);
    writer.writeInt64LE(this.lastGlobalTransactionIndex);
    writer.writeInt64LE(this.lastGlobalActionIndex);
    writer.writeFixed8(this.systemFee);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): BlockData {
    const hash = reader.readUInt256();
    const lastGlobalTransactionIndex = reader.readInt64LE();
    const lastGlobalActionIndex = reader.readInt64LE();
    const systemFee = reader.readFixed8();

    return new this({
      hash,
      systemFee,
      lastGlobalTransactionIndex,
      lastGlobalActionIndex,
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
