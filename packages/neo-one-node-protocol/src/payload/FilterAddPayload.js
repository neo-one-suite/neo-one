/* @flow */
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  BinaryReader,
  createSerializeWire,
} from '@neo-one/client-core';

export type FilterAddPayloadAdd = {|
  data: Buffer,
|};

export default class FilterAddPayload
  implements SerializableWire<FilterAddPayload> {
  data: Buffer;

  constructor({ data }: FilterAddPayloadAdd) {
    this.data = data;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.data);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): FilterAddPayload {
    const data = reader.readVarBytesLE(520);

    return new this({ data });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
