/* @flow */
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  type UInt256,
  BinaryReader,
  common,
  createSerializeWire,
} from '@neo-one/client-core';

export type GetBlocksPayloadAdd = {|
  hashStart: Array<UInt256>,
  hashStop?: UInt256,
|};

export default class GetBlocksPayload
  implements SerializableWire<GetBlocksPayload> {
  hashStart: Array<UInt256>;
  hashStop: UInt256;

  constructor({ hashStart, hashStop }: GetBlocksPayloadAdd) {
    this.hashStart = hashStart;
    this.hashStop = hashStop || common.ZERO_UINT256;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeArray(this.hashStart, value => {
      writer.writeUInt256(value);
    });
    writer.writeUInt256(this.hashStop);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): GetBlocksPayload {
    const hashStart = reader.readArray(() => reader.readUInt256());
    const hashStop = reader.readUInt256();
    return new this({ hashStart, hashStop });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
