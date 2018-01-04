/* @flow */
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  type UInt256,
  BinaryReader,
  createSerializeWire,
} from '@neo-one/client-core';

import { type InventoryType, assertInventoryType } from './InventoryType';

export type InvPayloadAdd = {|
  type: InventoryType,
  hashes: Array<UInt256>,
|};

export default class InvPayload implements SerializableWire<InvPayload> {
  type: InventoryType;
  hashes: Array<UInt256>;

  constructor({ type, hashes }: InvPayloadAdd) {
    this.type = type;
    this.hashes = hashes;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeArray(this.hashes, value => {
      writer.writeUInt256(value);
    });
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): InvPayload {
    const type = assertInventoryType(reader.readUInt8());
    const hashes = reader.readArray(() => reader.readUInt256());
    return new this({ type, hashes });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
