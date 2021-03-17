import { BinaryReader, BinaryWriter, InvalidFormatError, IOHelper } from '@neo-one/client-common';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
} from './Serializable';

export interface ContractIDStateAdd {
  readonly nextId: number;
}

export class ContractIDState implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractIDState {
    const { reader } = options;
    const nextId = reader.readUInt32LE();
    if (nextId < 0) {
      throw new InvalidFormatError();
    }

    return new this({
      nextId,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractIDState {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly nextId: number;
  public readonly size = IOHelper.sizeOfUInt32LE;
  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ nextId }: ContractIDStateAdd) {
    this.nextId = nextId;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt32LE(this.nextId);
  }
}
