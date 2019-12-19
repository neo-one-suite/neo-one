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

export class StorageItem implements SerializableWire<StorageItem>, SerializableJSON<StorageItemJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): StorageItem {
    const value = reader.readVarBytesLE();
    const isConstant = reader.readBoolean();

    return new this({
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

  public readonly value: Buffer;
  public readonly isConstant: boolean;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ value, isConstant }: StorageItemAdd) {
    this.value = value;
    this.isConstant = isConstant;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfVarBytesLE(this.value) + IOHelper.sizeOfBoolean);
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public clone(): StorageItem {
    return new StorageItem({
      value: this.value,
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
