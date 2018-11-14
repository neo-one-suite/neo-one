import {
  BinaryWriter,
  createSerializeWire,
  InvalidFormatError,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions } from '@neo-one/node-core';
export interface FilterLoadPayloadAdd {
  readonly filter: Buffer;
  readonly k: number;
  readonly tweak: number;
}

export class FilterLoadPayload implements SerializableWire<FilterLoadPayload> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): FilterLoadPayload {
    const filter = reader.readVarBytesLE(36000);
    const k = reader.readUInt8();
    const tweak = reader.readUInt32LE();
    if (k > 50) {
      throw new InvalidFormatError();
    }

    return new this({ filter, k, tweak });
  }

  public static deserializeWire(options: DeserializeWireOptions): FilterLoadPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly filter: Buffer;
  public readonly k: number;
  public readonly tweak: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ filter, k, tweak }: FilterLoadPayloadAdd) {
    this.filter = filter;
    this.k = k;
    this.tweak = tweak;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.filter);
    writer.writeUInt8(this.k);
    writer.writeUInt32LE(this.tweak);
  }
}
