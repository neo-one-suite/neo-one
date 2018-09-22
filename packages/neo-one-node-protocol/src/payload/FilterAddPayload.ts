import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions } from '@neo-one/node-core';
export interface FilterAddPayloadAdd {
  readonly data: Buffer;
}

export class FilterAddPayload implements SerializableWire<FilterAddPayload> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): FilterAddPayload {
    const data = reader.readVarBytesLE(520);

    return new this({ data });
  }

  public static deserializeWire(options: DeserializeWireOptions): FilterAddPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly data: Buffer;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ data }: FilterAddPayloadAdd) {
    this.data = data;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.data);
  }
}
