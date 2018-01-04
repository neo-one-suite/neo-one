/* @flow */
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  BinaryReader,
  Header,
  createSerializeWire,
} from '@neo-one/client-core';

export type HeadersPayloadAdd = {|
  headers: Array<Header>,
|};

export default class HeadersPayload
  implements SerializableWire<HeadersPayload> {
  headers: Array<Header>;

  constructor({ headers }: HeadersPayloadAdd) {
    this.headers = headers;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeArray(this.headers, header => header.serializeWireBase(writer));
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): HeadersPayload {
    const { reader } = options;
    const headers = reader.readArray(() => Header.deserializeWireBase(options));

    return new this({ headers });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
