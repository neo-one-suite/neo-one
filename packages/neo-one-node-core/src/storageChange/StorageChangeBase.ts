import { BinaryWriter, IOHelper, UInt160, utils } from '@neo-one/client-common';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '../Serializable';
import { BinaryReader } from '../utils';
import { StorageChange } from './StorageChange';
import { assertStorageChangeType, StorageChangeType } from './StorageChangeType';

export interface StorageChangeBaseAdd<T extends StorageChangeType> {
  readonly type: T;
  readonly hash: UInt160;
  readonly key: Buffer;
}

export abstract class StorageChangeBase<T extends StorageChangeType = StorageChangeType>
  implements SerializableWire<StorageChange> {
  public static deserializeStorageChangeWireBase(
    options: DeserializeWireBaseOptions,
  ): {
    readonly type: StorageChangeType;
    readonly hash: UInt160;
    readonly key: Buffer;
  } {
    const { reader } = options;
    const type = reader.readUInt8();
    const hash = reader.readUInt160();
    const key = reader.readVarBytesLE();

    return {
      type: assertStorageChangeType(type),
      hash,
      key,
    };
  }

  public static deserializeWireBase(_options: DeserializeWireBaseOptions): StorageChangeBase {
    throw new Error('Not Implemented');
  }

  public static deserializeWire(options: DeserializeWireOptions): StorageChangeBase {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly type: T;
  public readonly hash: UInt160;
  public readonly key: Buffer;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  protected readonly sizeExclusive: () => number;
  private readonly sizeInternal: () => number;

  public constructor({ type, hash, key }: StorageChangeBaseAdd<T>) {
    this.type = type;
    this.hash = hash;
    this.key = key;
    this.sizeExclusive = () => 0;
    this.sizeInternal = utils.lazy(
      () => this.sizeExclusive() + IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt160 + IOHelper.sizeOfVarBytesLE(this.key),
    );
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeUInt160(this.hash);
    writer.writeVarBytesLE(this.key);
  }
}
