import { BinaryWriter, createSerializeWire, IOHelper, SerializableWire, UInt256 } from '@neo-one/client-common';
import {
  BinaryReader,
  Block,
  BlockBase,
  BlockBaseAdd,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  MerkleTree,
  utils,
} from '@neo-one/node-core';
export interface MerkleBlockPayloadAdd extends BlockBaseAdd {
  readonly contentCount: number;
  readonly hashes: readonly UInt256[];
  readonly flags: Buffer;
}

export class MerkleBlockPayload extends BlockBase implements SerializableWire {
  public static create({
    block,
    flags,
  }: {
    readonly block: Block;
    readonly flags: readonly boolean[];
  }): MerkleBlockPayload {
    const tree = new MerkleTree(block.transactions.map((transaction) => transaction.hash)).trim(flags);

    const mutableBuffer = Buffer.allocUnsafe(Math.floor((flags.length + 7) / 8));
    // tslint:disable-next-line no-loop-statement
    for (let i = 0; i < flags.length; i += 1) {
      if (flags[i]) {
        // tslint:disable-next-line no-bitwise
        mutableBuffer[Math.floor(i / 8)] |= 1 << i % 8;
      }
    }

    return new MerkleBlockPayload({
      version: block.version,
      previousHash: block.previousHash,
      merkleRoot: block.merkleRoot,
      timestamp: block.timestamp,
      index: block.index,
      nextConsensus: block.nextConsensus,
      witness: block.witness,
      contentCount: block.transactions.length + 1,
      hashes: tree.toHashArray(),
      flags: mutableBuffer,
    });
  }
  public static deserializeWireBase(options: DeserializeWireBaseOptions): MerkleBlockPayload {
    const { reader } = options;
    const blockBase = super.deserializeWireBase(options);
    const contentCount = reader.readVarUIntLE(Block.MaxTransactionsPerBlock.addn(1)).toNumber();
    const hashes = reader.readArray(() => reader.readUInt256(), contentCount);
    const flags = reader.readVarBytesLE((contentCount + 7) / 8);

    return new this({
      version: blockBase.version,
      previousHash: blockBase.previousHash,
      merkleRoot: blockBase.merkleRoot,
      timestamp: blockBase.timestamp,
      index: blockBase.index,
      nextConsensus: blockBase.nextConsensus,
      witness: blockBase.witness,
      contentCount,
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

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly contentCount: number;
  public readonly hashes: readonly UInt256[];
  public readonly flags: Buffer;
  private readonly merkleBlockPayloadSizeInternal: () => number;

  public constructor({
    version,
    previousHash,
    merkleRoot,
    timestamp,
    index,
    nextConsensus,
    witness,
    contentCount,
    hashes,
    flags,
  }: MerkleBlockPayloadAdd) {
    super({
      version,
      previousHash,
      merkleRoot,
      timestamp,
      index,
      nextConsensus,
      witness,
    });

    this.contentCount = contentCount;
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
    writer.writeVarUIntLE(this.contentCount);
    writer.writeArray(this.hashes, (hash) => {
      writer.writeUInt256(hash);
    });
    writer.writeVarBytesLE(this.flags);
  }
}
