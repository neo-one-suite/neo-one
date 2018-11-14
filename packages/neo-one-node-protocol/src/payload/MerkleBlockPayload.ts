import { BinaryWriter, IOHelper, SerializableWire, UInt256 } from '@neo-one/client-common';
import {
  BinaryReader,
  BlockBase,
  BlockBaseAdd,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  utils,
} from '@neo-one/node-core';
export interface MerkleBlockPayloadAdd extends BlockBaseAdd {
  readonly transactionCount: number;
  readonly hashes: ReadonlyArray<UInt256>;
  readonly flags: Buffer;
}

export class MerkleBlockPayload extends BlockBase implements SerializableWire<MerkleBlockPayload> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): MerkleBlockPayload {
    const { reader } = options;
    const blockBase = super.deserializeBlockBaseWireBase(options);
    const transactionCount = reader.readVarUIntLE(utils.INT_MAX_VALUE).toNumber();
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

  public static deserializeWire(options: DeserializeWireOptions): MerkleBlockPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly transactionCount: number;
  public readonly hashes: ReadonlyArray<UInt256>;
  public readonly flags: Buffer;
  private readonly merkleBlockPayloadSizeInternal: () => number;

  public constructor({
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

    this.merkleBlockPayloadSizeInternal = utils.lazy(
      () =>
        super.size +
        IOHelper.sizeOfUInt32LE +
        IOHelper.sizeOfArray(this.hashes, () => IOHelper.sizeOfUInt256) +
        IOHelper.sizeOfVarBytesLE(this.flags),
    );
  }

  public get size(): number {
    return this.merkleBlockPayloadSizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarUIntLE(this.transactionCount);
    writer.writeArray(this.hashes, (hash) => {
      writer.writeUInt256(hash);
    });
    writer.writeVarBytesLE(this.flags);
  }
}
