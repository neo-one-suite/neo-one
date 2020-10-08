import { BinaryWriter, IOHelper, UInt256 } from '@neo-one/client-common';
import { BaseState } from '@neo-one/client-full-common';
import { BN } from 'bn.js';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from './Serializable';
import { BinaryReader, utils } from './utils';

export interface TransactionDataAdd {
  readonly version?: number;
  readonly hash: UInt256;
  readonly blockHash: UInt256;
  readonly startHeight: number;
  readonly index: number;
  readonly globalIndex: BN;
  readonly endHeights?: { readonly [index: number]: number };
  readonly claimed?: { readonly [index: number]: boolean };
}

export interface TransactionDataUpdate {
  readonly endHeights?: { readonly [index: number]: number };
  readonly claimed?: { readonly [index: number]: boolean };
}

export interface TransactionDataKey {
  readonly hash: UInt256;
}

export class TransactionData extends BaseState implements SerializableWire {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): TransactionData {
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

  public static deserializeWire(options: DeserializeWireOptions): TransactionData {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hash: UInt256;
  public readonly blockHash: UInt256;
  public readonly startHeight: number;
  public readonly index: number;
  public readonly globalIndex: BN;
  public readonly endHeights: {
    readonly [index: number]: number;
  };
  public readonly claimed: {
    readonly [index: number]: boolean;
  };
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({
    version,
    hash,
    blockHash,
    startHeight,
    index,
    globalIndex,
    endHeights = {},
    claimed = {},
  }: TransactionDataAdd) {
    super({ version });
    this.hash = hash;
    this.blockHash = blockHash;
    this.startHeight = startHeight;
    this.index = index;
    this.globalIndex = globalIndex;
    this.endHeights = endHeights;
    this.claimed = claimed;
    this.sizeInternal = utils.lazy(
      () =>
        IOHelper.sizeOfUInt8 +
        IOHelper.sizeOfUInt256 +
        IOHelper.sizeOfUInt32LE +
        IOHelper.sizeOfObject(this.endHeights, () => IOHelper.sizeOfUInt32LE + IOHelper.sizeOfUInt32LE) +
        IOHelper.sizeOfObject(this.claimed, () => IOHelper.sizeOfUInt32LE + IOHelper.sizeOfBoolean),
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public update({ endHeights = this.endHeights, claimed = this.claimed }: TransactionDataUpdate): TransactionData {
    return new TransactionData({
      version: this.version,
      hash: this.hash,
      blockHash: this.blockHash,
      startHeight: this.startHeight,
      index: this.index,
      globalIndex: this.globalIndex,
      endHeights,
      claimed,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
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
}
