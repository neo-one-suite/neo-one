import { BinaryWriter, UInt160 } from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../Serializable';
import { StorageChangeBase, StorageChangeBaseAdd } from './StorageChangeBase';
import { StorageChangeType } from './StorageChangeType';

export interface StorageChangeAddModifyBaseAdd<T extends StorageChangeType> extends StorageChangeBaseAdd<T> {
  readonly value: Buffer;
}

export abstract class StorageChangeAddModifyBase<
  T extends StorageChangeType = StorageChangeType
> extends StorageChangeBase<T> {
  public static deserializeStorageChangeAddModifyWireBase(
    options: DeserializeWireBaseOptions,
  ): {
    readonly type: StorageChangeType;
    readonly hash: UInt160;
    readonly key: Buffer;
    readonly value: Buffer;
  } {
    const { type, hash, key } = super.deserializeStorageChangeWireBase(options);
    const { reader } = options;
    const value = reader.readVarBytesLE();

    return { type, hash, key, value };
  }

  public readonly value: Buffer;

  public constructor({ type, hash, key, value }: StorageChangeAddModifyBaseAdd<T>) {
    super({ type, hash, key });
    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarBytesLE(this.value);
  }
}
