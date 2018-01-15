/* @flow */
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  type UInt256,
  BaseState,
  BinaryReader,
  IOHelper,
  createSerializeWire,
  utils,
} from '@neo-one/client-core';

export type TransactionSpentCoinsAdd = {|
  version?: number,
  hash: UInt256,
  startHeight: number,
  endHeights?: { [index: number]: number },
  claimed?: { [index: number]: boolean },
|};
export type TransactionSpentCoinsUpdate = {|
  endHeights?: { [index: number]: number },
  claimed?: { [index: number]: boolean },
|};
export type TransactionSpentCoinsKey = {|
  hash: UInt256,
|};

export default class TransactionSpentCoins extends BaseState
  implements SerializableWire<TransactionSpentCoins> {
  hash: UInt256;
  startHeight: number;
  endHeights: { [index: number]: number };
  claimed: { [index: number]: boolean };

  __size: () => number;

  constructor({
    version,
    hash,
    startHeight,
    endHeights,
    claimed,
  }: TransactionSpentCoinsAdd) {
    super({ version });
    this.hash = hash;
    this.startHeight = startHeight;
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

  update({
    endHeights,
    claimed,
  }: TransactionSpentCoinsUpdate): TransactionSpentCoins {
    return new this.constructor({
      version: this.version,
      hash: this.hash,
      startHeight: this.startHeight,
      endHeights: endHeights == null ? this.endHeights : endHeights,
      claimed: claimed == null ? this.claimed : claimed,
    });
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.version);
    writer.writeUInt256(this.hash);
    writer.writeUInt32LE(this.startHeight);
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
  }: DeserializeWireBaseOptions): TransactionSpentCoins {
    const version = reader.readUInt8();
    const hash = reader.readUInt256();
    const startHeight = reader.readUInt32LE();
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
      startHeight,
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
