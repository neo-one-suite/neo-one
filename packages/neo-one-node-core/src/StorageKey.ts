import { BinaryWriter, common, createSerializeWire, IOHelper, SerializeWire, UInt160 } from '@neo-one/client-common';
import { Equatable } from './Equatable';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableWire } from './Serializable';
import { BinaryReader, utils } from './utils';

export interface StorageKeyAdd {
  readonly scriptHash: UInt160;
  readonly key: Buffer;
}

export class StorageKey implements SerializableWire<StorageKey>, Equatable<StorageKey> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions) {
    const scriptHash = reader.readUInt160();
    const key = reader.readBytesWithGrouping();

    return new this({
      scriptHash,
      key,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions) {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // TODO: replace this logic to not use a while loop
  public static createSearchPrefix(hash: UInt160, prefix: Buffer) {
    let index = 0;
    let remaining = prefix.length;
    let buffers: Buffer[] = [];
    // tslint:disable-next-line: no-loop-statement
    while (remaining > common.GROUPING_SIZE_BYTES) {
      buffers = buffers
        .concat(prefix.slice(index, index + common.GROUPING_SIZE_BYTES))
        .concat(Buffer.from([common.GROUPING_SIZE_BYTES]));
      index = index + common.GROUPING_SIZE_BYTES;
      remaining = remaining - common.GROUPING_SIZE_BYTES;
    }
    if (remaining > 0) {
      buffers = buffers.concat(prefix.slice(index, index + remaining));
    }

    return Buffer.concat([common.uInt160ToBuffer(hash), Buffer.concat(buffers)]);
  }

  public readonly scriptHash: UInt160;
  public readonly key: Buffer;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly sizeInternal: () => number;

  public constructor({ scriptHash, key }: StorageKeyAdd) {
    this.scriptHash = scriptHash;
    this.key = key;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt160 + (this.key.length / 16 + 1) * 17);
  }

  public get size() {
    return this.sizeInternal();
  }

  // TODO: need to check the logic here, I'm not sure what we do/don't need to implement from C# (such as ReferenceEquals)
  public equals(other: StorageKey) {
    return this.scriptHash === other.scriptHash && this.key === other.key;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt160(this.scriptHash);
    writer.writeBytesWithGrouping(this.key);
  }
}
