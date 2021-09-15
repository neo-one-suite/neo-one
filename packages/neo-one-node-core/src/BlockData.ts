import {
  BinaryReader,
  BinaryWriter,
  common,
  createSerializeWire,
  IOHelper,
  SerializableWire,
  SerializeWire,
  UInt256,
  UInt256Hex,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { Equals, Equatable } from './Equatable';
import { DeserializeWireBaseOptions, DeserializeWireOptions } from './Serializable';
import { utils } from './utils';

export interface BlockDataKey {
  readonly hash: UInt256;
}

export interface BlockDataAdd {
  readonly hash: UInt256;
  readonly lastGlobalTransactionIndex: BN;
  readonly lastGlobalActionIndex: BN;
  readonly blockActionsCount: number;
}

export class BlockData implements Equatable, SerializableWire {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): BlockData {
    const hash = reader.readUInt256();
    const lastGlobalTransactionIndex = reader.readInt64LE();
    const lastGlobalActionIndex = reader.readInt64LE();
    const blockActionsCount = reader.readUInt32LE();

    return new this({
      hash,
      lastGlobalTransactionIndex,
      lastGlobalActionIndex,
      blockActionsCount,
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
  public readonly blockActionsCount: number;
  public readonly equals: Equals = utils.equals(BlockData, this, (other) => common.uInt256Equal(this.hash, other.hash));
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ hash, lastGlobalTransactionIndex, lastGlobalActionIndex, blockActionsCount }: BlockDataAdd) {
    this.hash = hash;
    this.hashHex = common.uInt256ToHex(hash);
    this.lastGlobalTransactionIndex = lastGlobalTransactionIndex;
    this.lastGlobalActionIndex = lastGlobalActionIndex;
    this.blockActionsCount = blockActionsCount;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt256 + IOHelper.sizeOfUInt32LE);
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hash);
    writer.writeInt64LE(this.lastGlobalTransactionIndex);
    writer.writeInt64LE(this.lastGlobalActionIndex);
    writer.writeUInt32LE(this.blockActionsCount);
  }
}
