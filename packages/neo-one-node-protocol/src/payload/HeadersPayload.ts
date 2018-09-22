import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions, Header } from '@neo-one/node-core';
export interface HeadersPayloadAdd {
  readonly headers: ReadonlyArray<Header>;
}

export class HeadersPayload implements SerializableWire<HeadersPayload> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): HeadersPayload {
    const { reader } = options;
    const headers = reader.readArray(() => Header.deserializeWireBase(options));

    return new this({ headers });
  }

  public static deserializeWire(options: DeserializeWireOptions): HeadersPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly headers: ReadonlyArray<Header>;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ headers }: HeadersPayloadAdd) {
    this.headers = headers;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeArray(this.headers, (header) => header.serializeWireBase(writer));
  }
}
