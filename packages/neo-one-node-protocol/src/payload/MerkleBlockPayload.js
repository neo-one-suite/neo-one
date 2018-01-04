/* @fl/* @flow */
import {
  type BinaryWriter,
  type BlockBaseAdd,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializableWire,
  type UInt256,
  BinaryReader,
  BlockBase,
  IOHelper,
  utils,
} from '@neo-one/client-core';

export type MerkleBlockPayloadAdd = {|
  ...BlockBaseAdd,
  transactionCount: number,
  hashes: Array<UInt256>,
  flags: Buffer,
|};

export default class MerkleBlockPayload extends BlockBase
  implements SerializableWire<MerkleBlockPayload> {
  transactionCount: number;
  hashes: Array<UInt256>;
  flags: Buffer;

  __merkleBlockPayloadSize: () => number;

  constructor({
    version,
    previousHash,
    merkleRoot,
    timestamp,
    index,
    consensusData,
    nextConsensus,
    script,
    transactionCount,
    hashes,
    flags,
  }: MerkleBlockPayloadAdd) {
    super({
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      consensusData,
      nextConsensus,
      script,
    });
    this.transactionCount = transactionCount;
    this.hashes = hashes;
    this.flags = flags;

    this.__merkleBlockPayloadSize = utils.lazy(
      () =>
        super.size +
        IOHelper.sizeOfUInt32LE +
        IOHelper.sizeOfArray(this.hashes, () => IOHelper.sizeOfUInt256) +
        IOHelper.sizeOfVarBytesLE(this.flags),
    );
  }

  get size(): number {
    return this.__merkleBlockPayloadSize();
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarUIntLE(this.transactionCount);
    writer.writeArray(this.hashes, hash => {
      writer.writeUInt256(hash);
    });
    writer.writeVarBytesLE(this.flags);
  }

  static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): MerkleBlockPayload {
    const { reader } = options;
    const blockBase = super.deserializeBlockBaseWireBase(options);
    const transactionCount = reader
      .readVarUIntLE(utils.INT_MAX_VALUE)
      .toNumber();
    const hashes = reader.readArray(() => reader.readUInt256());
    const flags = reader.readVarBytesLE();

    return new this({
      version: blockBase.version,
      previousHash: blockBase.previousHash,
      merkleRoot: blockBase.merkleRoot,
      timestamp: blockBase.timestamp,
      index: blockBase.index,
      consensusData: blockBase.consensusData,
      nextConsensus: blockBase.nextConsensus,
      script: blockBase.script,
      transactionCount,
      hashes,
      flags,
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
