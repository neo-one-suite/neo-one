import {
  BinaryWriter,
  IOHelper,
  JSONHelper,
  StorageItemJSON,
  toJSONStorageFlags,
  UInt160,
} from '@neo-one/client-common';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from './Serializable';
import { StorageFlags } from './StorageFlags';
import { BinaryReader, utils } from './utils';

export interface StorageItemAdd {
  readonly hash: UInt160;
  readonly key: Buffer;
  readonly value: Buffer;
  readonly flags: StorageFlags;
}

export interface StorageItemUpdate {
  readonly value: Buffer;
  readonly flags: StorageFlags;
}

export interface StorageItemsKey {
  readonly hash?: UInt160;
  readonly prefix?: Buffer;
}

export interface StorageItemKey {
  readonly hash: UInt160;
  readonly key: Buffer;
}

export class StorageItem implements SerializableWire<StorageItem>, SerializableJSON<StorageItemJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): StorageItem {
    const hash = reader.readUInt160();
    const key = reader.readVarBytesLE();
    const value = reader.readVarBytesLE();
    const flags = reader.readUInt8();

    return new this({
      hash,
      key,
      value,
      flags,
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
  public readonly flags: StorageFlags;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ hash, key, value, flags }: StorageItemAdd) {
    this.hash = hash;
    this.key = key;
    this.value = value;
    this.flags = flags;
    this.sizeInternal = utils.lazy(
      () =>
        IOHelper.sizeOfUInt160 +
        IOHelper.sizeOfVarBytesLE(this.key) +
        IOHelper.sizeOfVarBytesLE(this.value) +
        IOHelper.sizeOfUInt8,
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public update({ value, flags }: StorageItemUpdate): StorageItem {
    return new StorageItem({
      hash: this.hash,
      key: this.key,
      value,
      flags,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.hash);
    writer.writeVarBytesLE(this.key);
    writer.writeVarBytesLE(this.value);
    writer.writeUInt8(this.flags);
  }

  public serializeJSON(_context: SerializeJSONContext): StorageItemJSON {
    return {
      hash: JSONHelper.writeUInt160(this.hash),
      key: JSONHelper.writeBuffer(this.key),
      value: JSONHelper.writeBuffer(this.value),
      flags: toJSONStorageFlags(this.flags),
    };
  }
}
