import { BinaryWriter, common, IOHelper, JSONHelper, StorageItemJSON, UInt160 } from '@neo-one/client-common';
import { Equals, Equatable } from './Equatable';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from './Serializable';
import { BinaryReader, utils } from './utils';

export interface StorageItemAdd {
  readonly hash: UInt160;
  readonly key: Buffer;
  readonly value: Buffer;
}

export interface StorageItemUpdate {
  readonly value: Buffer;
}

export interface StorageItemsKey {
  readonly hash?: UInt160;
  readonly prefix?: Buffer;
}

export interface StorageItemKey {
  readonly hash: UInt160;
  readonly key: Buffer;
}

export class StorageItem implements SerializableWire<StorageItem>, Equatable, SerializableJSON<StorageItemJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): StorageItem {
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
    this,
    (other) =>
      common.uInt160Equal(this.hash, other.hash) && this.key.equals(other.key) && this.value.equals(other.value),
  );
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ hash, key, value }: StorageItemAdd) {
    this.hash = hash;
    this.key = key;
    this.value = value;
    this.sizeInternal = utils.lazy(
      () => IOHelper.sizeOfUInt160 + IOHelper.sizeOfVarBytesLE(this.key) + IOHelper.sizeOfVarBytesLE(this.value),
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

  public serializeJSON(_context: SerializeJSONContext): StorageItemJSON {
    return {
      hash: JSONHelper.writeUInt160(this.hash),
      key: JSONHelper.writeBuffer(this.key),
      value: JSONHelper.writeBuffer(this.value),
    };
  }
}
