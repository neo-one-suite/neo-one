import { BinaryWriter, IOHelper, UInt256 } from '@neo-one/client-common';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
} from './Serializable';
import { BinaryReader, utils } from './utils';

export interface HashIndexStateAdd {
  readonly hash: UInt256;
  readonly index: number;
}

export class HashIndexState implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): HashIndexState {
    const { reader } = options;
    const hash = reader.readUInt256();
    const index = reader.readUInt32LE();

    return new this({
      hash,
      index,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): HashIndexState {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hash: UInt256;
  public readonly index: number;
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  private readonly sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt256 + IOHelper.sizeOfUInt32LE);

  public constructor({ hash, index }: HashIndexStateAdd) {
    this.hash = hash;
    this.index = index;
  }

  public get size() {
    return this.sizeInternal();
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt256(this.hash);
    writer.writeUInt32LE(this.index);
  }
}
