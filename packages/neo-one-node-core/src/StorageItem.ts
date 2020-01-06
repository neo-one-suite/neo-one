import { BinaryWriter, IOHelper, JSONHelper, StorageItemJSON, UInt160 } from '@neo-one/client-common';
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
  readonly isConstant: boolean;
}

export interface StorageItemsKey {
  readonly hash?: UInt160;
  readonly prefix?: Buffer;
}

export interface StorageItemKey {
  readonly hash: UInt160;
  readonly key: Buffer;
}

export interface StorageItemUpdate {
  readonly value: Buffer;
}

export class StorageItem implements SerializableWire<StorageItem>, SerializableJSON<StorageItemJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): StorageItem {
    const hash = reader.readUInt160();
    const key = reader.readVarBytesLE();
    const value = reader.readVarBytesLE();
    const isConstant = reader.readBoolean();

    return new this({
      hash,
      key,
      value,
      isConstant,
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
  public readonly isConstant: boolean;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ hash, key, value, isConstant }: StorageItemAdd) {
    this.hash = hash;
    this.key = key;
    this.value = value;
    this.isConstant = isConstant;
    this.sizeInternal = utils.lazy(
      () =>
        IOHelper.sizeOfUInt160 +
        IOHelper.sizeOfVarBytesLE(this.key) +
        IOHelper.sizeOfVarBytesLE(this.value) +
        IOHelper.sizeOfVarBytesLE(this.value) +
        IOHelper.sizeOfBoolean,
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
      isConstant: this.isConstant,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.value);
    writer.writeBoolean(this.isConstant);
  }

  public serializeJSON(_context: SerializeJSONContext): StorageItemJSON {
    return {
      value: JSONHelper.writeBuffer(this.value),
      isConstant: this.isConstant,
    };
  }
}
