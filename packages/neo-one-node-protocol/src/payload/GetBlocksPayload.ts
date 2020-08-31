import {
  BinaryWriter,
  common,
  createSerializeWire,
  SerializableWire,
  SerializeWire,
  UInt256,
} from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions } from '@neo-one/node-core';
export interface GetBlocksPayloadAdd {
  readonly hashStart: readonly UInt256[];
  readonly hashStop?: UInt256;
}

export class GetBlocksPayload implements SerializableWire {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): GetBlocksPayload {
    const hashStart = reader.readArray(() => reader.readUInt256());
    const hashStop = reader.readUInt256();

    return new this({ hashStart, hashStop });
  }

  public static deserializeWire(options: DeserializeWireOptions): GetBlocksPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hashStart: readonly UInt256[];
  public readonly hashStop: UInt256;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ hashStart, hashStop = common.ZERO_UINT256 }: GetBlocksPayloadAdd) {
    this.hashStart = hashStart;
    this.hashStop = hashStop;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeArray(this.hashStart, (value) => {
      writer.writeUInt256(value);
    });
    writer.writeUInt256(this.hashStop);
  }
}
