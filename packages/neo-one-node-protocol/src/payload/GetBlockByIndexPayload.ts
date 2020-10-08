import { BinaryWriter, createSerializeWire, InvalidFormatError } from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions } from '@neo-one/node-core';
import { HeadersPayload } from './HeadersPayload';

export interface GetBlockByIndexPayloadAdd {
  readonly indexStart: number;
  readonly count: number;
}

export class GetBlockByIndexPayload {
  public static create(indexStart: number, count = -1) {
    return new GetBlockByIndexPayload({
      indexStart,
      count,
    });
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions) {
    const { reader } = options;
    const indexStart = reader.readUInt32LE();
    const count = reader.readUInt16LE();
    if (count < -1 || count === 0 || count > HeadersPayload.maxHeadersCount) {
      throw new InvalidFormatError(`Expected count to be either -1 or 0 < count < 2000, found: ${count}`);
    }

    return new GetBlockByIndexPayload({
      indexStart,
      count,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions) {
    return this.deserializeWireBase({
      reader: new BinaryReader(options.buffer),
      context: options.context,
    });
  }

  public readonly indexStart: number;
  public readonly count: number;
  public readonly serializeWire = createSerializeWire(this.serializeWireBase);

  public constructor({ indexStart, count }: GetBlockByIndexPayloadAdd) {
    this.indexStart = indexStart;
    this.count = count;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeInt32LE(this.indexStart);
    writer.writeInt16LE(this.count);
  }
}
