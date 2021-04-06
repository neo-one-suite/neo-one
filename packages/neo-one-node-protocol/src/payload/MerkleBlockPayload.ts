import {
  BinaryWriter,
  createSerializeWire,
  IOHelper,
  SerializableWire,
  UInt256,
  utils as clientCommonUtils,
} from '@neo-one/client-common';
import {
  BinaryReader,
  Block,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  Header,
  MerkleTree,
  utils,
} from '@neo-one/node-core';

export interface MerkleBlockPayloadAdd {
  readonly header: Header;
  readonly txCount: number;
  readonly hashes: readonly UInt256[];
  readonly flags: Buffer;
}

export class MerkleBlockPayload implements SerializableWire {
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
      header: block.header,
      txCount: block.transactions.length,
      hashes: tree.toHashArray(),
      flags: mutableBuffer,
    });
  }
  public static deserializeWireBase(options: DeserializeWireBaseOptions): MerkleBlockPayload {
    const { reader } = options;
    const header = Header.deserializeWireBase(options);
    const txCount = reader.readVarUIntLE(clientCommonUtils.USHORT_MAX_NUMBER).toNumber();
    const hashes = reader.readArray(() => reader.readUInt256(), txCount);
    const flags = reader.readVarBytesLE((Math.max(txCount, 1) + 7) / 8);

    return new this({
      header,
      txCount,
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
  public readonly hashes: readonly UInt256[];
  public readonly txCount: number;
  public readonly header: Header;
  public readonly flags: Buffer;
  private readonly merkleBlockPayloadSizeInternal: () => number;

  public constructor({ header, txCount, hashes, flags }: MerkleBlockPayloadAdd) {
    this.header = header;
    this.txCount = txCount;
    this.hashes = hashes;
    this.flags = flags;

    this.merkleBlockPayloadSizeInternal = utils.lazy(
      () =>
        this.header.size +
        IOHelper.sizeOfUInt32LE +
        IOHelper.sizeOfArray(this.hashes, () => IOHelper.sizeOfUInt256) +
        IOHelper.sizeOfVarBytesLE(this.flags),
    );
  }

  public get size(): number {
    return this.merkleBlockPayloadSizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.header.serializeWireBase(writer);
    writer.writeVarUIntLE(this.txCount);
    writer.writeArray(this.hashes, (hash) => {
      writer.writeUInt256(hash);
    });
    writer.writeVarBytesLE(this.flags);
  }
}
