import { BinaryWriter, UInt256 } from '@neo-one/client-common';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
} from './Serializable';
import { BinaryReader } from './utils';

export interface HeaderHashListAdd {
  readonly hashes: readonly UInt256[];
}

export type HeaderKey = number;

export class HeaderHashList implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): HeaderHashList {
    const { reader } = options;
    const hashes = reader.readArray(reader.readUInt256);

    return new this({
      hashes,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): HeaderHashList {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hashes: readonly UInt256[];
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public constructor({ hashes }: HeaderHashListAdd) {
    this.hashes = hashes;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeArray(this.hashes, (hash) => writer.writeUInt256(hash));
  }
}
