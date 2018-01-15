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

export type BlockSystemFeeKey = {|
  hash: UInt256,
|};
export type BlockSystemFeeAdd = {|
  hash: UInt256,
  systemFee: BN,
|};

export default class BlockSystemFee
  implements Equatable, SerializableWire<BlockSystemFee> {
  hash: UInt256;
  hashHex: UInt256Hex;
  systemFee: BN;

  __size: () => number;

  constructor({ hash, systemFee }: BlockSystemFeeAdd) {
    this.hash = hash;
    this.hashHex = common.uInt256ToHex(hash);
    this.systemFee = systemFee;
    this.__size = utils.lazy(
      () => IOHelper.sizeOfUInt256 + IOHelper.sizeOfFixed8,
    );
  }

  get size(): number {
    return this.__size();
  }

  equals: Equals = utils.equals(BlockSystemFee, other =>
    common.uInt256Equal(this.hash, other.hash),
  );

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hash);
    writer.writeFixed8(this.systemFee);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): BlockSystemFee {
    const hash = reader.readUInt256();
    const systemFee = reader.readFixed8();

    return new this({ hash, systemFee });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
