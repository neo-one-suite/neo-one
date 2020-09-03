import { BinaryWriter, createSerializeWire, IOHelper } from '@neo-one/client-common';
import { Equals, Equatable } from './Equatable';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableWire } from './Serializable';
import { BinaryReader, utils } from './utils';

export interface StorageKeyAdd {
  readonly id: number;
  readonly key: Buffer;
}

export class StorageKey implements Equatable, SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StorageKey {
    const { reader } = options;
    const id = reader.readUInt32LE();
    const key = reader.readBytes(reader.remaining);

    return new this({
      id,
      key,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): StorageKey {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // TODO: Verify this
  public static createSearchPrefix(id: number, prefix: Buffer) {
    return Buffer.concat([Buffer.from([id]), prefix]);
  }

  public readonly id: number;
  public readonly key: Buffer;

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly equals: Equals = utils.equals(
    StorageKey,
    this,
    (other) => this.id === other.id && this.key.equals(other.key),
  );
  private readonly sizeInternal: () => number;

  public constructor({ id, key }: StorageKeyAdd) {
    this.id = id;
    this.key = key;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt32LE + this.key.length);
  }

  public get size() {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt32LE(this.id);
    writer.writeBytes(this.key);
  }
}
