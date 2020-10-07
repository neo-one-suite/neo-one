import {
  BinaryWriter,
  createSerializeWire,
  InvalidFormatError,
  SerializableWire,
  SerializeWire,
  UInt256,
} from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions } from '@neo-one/node-core';
export interface GetBlocksPayloadAdd {
  readonly hashStart: UInt256;
  readonly count?: number;
}

export class GetBlocksPayload implements SerializableWire {
  public static create(hashStart: UInt256, count = -1) {
    return new GetBlocksPayload({
      hashStart,
      count,
    });
  }
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): GetBlocksPayload {
    const hashStart = reader.readUInt256();
    const count = reader.readUInt16LE();

    if (count < -1 || count === 0) {
      throw new InvalidFormatError(`Expected count === -1 || count > 0, found: ${count}`);
    }

    return new this({ hashStart, count });
  }

  public static deserializeWire(options: DeserializeWireOptions): GetBlocksPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly hashStart: UInt256;
  public readonly count: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ hashStart, count = -1 }: GetBlocksPayloadAdd) {
    this.hashStart = hashStart;
    this.count = count;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hashStart);
    writer.writeUInt16LE(this.count);
  }
}
