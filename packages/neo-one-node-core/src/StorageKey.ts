import { BinaryReader, BinaryWriter, createSerializeWire, IOHelper } from '@neo-one/client-common';
import { Equals, Equatable } from './Equatable';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableWire } from './Serializable';
import { utils } from './utils';

export interface StorageKeyAdd {
  readonly id: number;
  readonly key: Buffer;
}

export class StorageKey implements Equatable, SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StorageKey {
    const { reader } = options;
    const id = reader.readInt32LE();
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

  public static createSearchPrefix(id: number, prefix: Buffer) {
    const writer = new BinaryWriter();
    writer.writeInt32LE(id);
    const buffer = writer.toBuffer();

    return Buffer.concat([buffer, prefix]);
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
    writer.writeInt32LE(this.id);
    writer.writeBytes(this.key);
  }
}
