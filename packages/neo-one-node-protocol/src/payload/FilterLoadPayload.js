/* @flow */
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  BinaryReader,
  InvalidFormatError,
  createSerializeWire,
} from '@neo-one/client-core';

export type FilterLoadPayloadAdd = {|
  filter: Buffer,
  k: number,
  tweak: number,
|};

export default class FilterLoadPayload
  implements SerializableWire<FilterLoadPayload> {
  filter: Buffer;
  k: number;
  tweak: number;

  constructor({ filter, k, tweak }: FilterLoadPayloadAdd) {
    this.filter = filter;
    this.k = k;
    this.tweak = tweak;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarBytesLE(this.filter);
    writer.writeUInt8(this.k);
    writer.writeUInt32LE(this.tweak);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): FilterLoadPayload {
    const filter = reader.readVarBytesLE(36000);
    const k = reader.readUInt8();
    const tweak = reader.readUInt32LE();
    if (k > 50) {
      throw new InvalidFormatError();
    }
    return new this({ filter, k, tweak });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
