import {
  BinaryReader,
  BinaryWriter,
  common,
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  Equals,
  Equatable,
  IOHelper,
  SerializableWire,
  SerializeWire,
  UInt256,
  UInt256Hex,
  utils,
} from '@neo-one/client-core';
import { BN } from 'bn.js';

export interface BlockDataKey {
  readonly hash: UInt256;
}

export interface BlockDataAdd {
  readonly hash: UInt256;
  readonly lastGlobalTransactionIndex: BN;
  readonly lastGlobalActionIndex: BN;
  readonly systemFee: BN;
}

export class BlockData implements Equatable, SerializableWire<BlockData> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): BlockData {
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

  public static deserializeWire(options: DeserializeWireOptions): BlockData {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hash: UInt256;
  public readonly hashHex: UInt256Hex;
  public readonly lastGlobalTransactionIndex: BN;
  public readonly lastGlobalActionIndex: BN;
  public readonly systemFee: BN;
  public readonly equals: Equals = utils.equals(BlockData, this, (other) => common.uInt256Equal(this.hash, other.hash));
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ hash, lastGlobalTransactionIndex, lastGlobalActionIndex, systemFee }: BlockDataAdd) {
    this.hash = hash;
    this.hashHex = common.uInt256ToHex(hash);
    this.lastGlobalTransactionIndex = lastGlobalTransactionIndex;
    this.lastGlobalActionIndex = lastGlobalActionIndex;
    this.systemFee = systemFee;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt256 + IOHelper.sizeOfFixed8);
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hash);
    writer.writeInt64LE(this.lastGlobalTransactionIndex);
    writer.writeInt64LE(this.lastGlobalActionIndex);
    writer.writeFixed8(this.systemFee);
  }
}
