import { Equatable, Equals } from './Equatable';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializeJSONContext,
  SerializableJSON,
  SerializeWire,
  SerializableWire,
  createSerializeWire,
} from './Serializable';
import { common, UInt160 } from './common';
import {
  utils,
  BinaryReader,
  BinaryWriter,
  IOHelper,
  JSONHelper,
} from './utils';

export interface StorageItemAdd {
  hash: UInt160;
  key: Buffer;
  value: Buffer;
}

export interface StorageItemUpdate {
  value: Buffer;
}

export interface StorageItemsKey {
  hash?: UInt160;
  prefix?: Buffer;
}

export interface StorageItemKey {
  hash: UInt160;
  key: Buffer;
}

export interface StorageItemJSON {
  hash: string;
  key: string;
  value: string;
}

export class StorageItem
  implements
    SerializableWire<StorageItem>,
    Equatable,
    SerializableJSON<StorageItemJSON> {
  public static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): StorageItem {
    const hash = reader.readUInt160();
    const key = reader.readVarBytesLE();
    const value = reader.readVarBytesLE();

    return new this({
      hash,
      key,
      value,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): StorageItem {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hash: UInt160;
  public readonly key: Buffer;
  public readonly value: Buffer;
  public readonly equals: Equals = utils.equals(
    StorageItem,
    (other) =>
      common.uInt160Equal(this.hash, other.hash) &&
      this.key.equals(other.key) &&
      this.value.equals(other.value),
  );
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );
  private readonly sizeInternal: () => number;

  constructor({ hash, key, value }: StorageItemAdd) {
    this.hash = hash;
    this.key = key;
    this.value = value;
    this.sizeInternal = utils.lazy(
      () =>
        IOHelper.sizeOfUInt160 +
        IOHelper.sizeOfVarBytesLE(this.key) +
        IOHelper.sizeOfVarBytesLE(this.value),
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public update({ value }: StorageItemUpdate): StorageItem {
    return new StorageItem({
      hash: this.hash,
      key: this.key,
      value,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.hash);
    writer.writeVarBytesLE(this.key);
    writer.writeVarBytesLE(this.value);
  }

  public serializeJSON(context: SerializeJSONContext): StorageItemJSON {
    return {
      hash: JSONHelper.writeUInt160(this.hash),
      key: JSONHelper.writeBuffer(this.key),
      value: JSONHelper.writeBuffer(this.value),
    };
  }
}
