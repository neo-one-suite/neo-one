import { BinaryWriter, createSerializeWire } from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions, utils } from '@neo-one/node-core';

export interface PingPayloadAdd {
  readonly lastBlockIndex: number;
  readonly timestamp: number;
  readonly nonce: number;
}

export class PingPayload {
  public static create(height: number, nonceIn?: number) {
    const nonce = nonceIn ? nonceIn : utils.randomUInt();
    const timestamp = Math.round(Date.now() / 1000);

    return new PingPayload({
      lastBlockIndex: height,
      timestamp,
      nonce,
    });
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions) {
    const { reader } = options;
    const lastBlockIndex = reader.readUInt32LE();
    const timestamp = reader.readUInt32LE();
    const nonce = reader.readUInt32LE();

    return new this({
      lastBlockIndex,
      timestamp,
      nonce,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions) {
    return this.deserializeWireBase({
      reader: new BinaryReader(options.buffer),
      context: options.context,
    });
  }

  public readonly lastBlockIndex: number;
  public readonly timestamp: number;
  public readonly nonce: number;

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ lastBlockIndex, timestamp, nonce }: PingPayloadAdd) {
    this.lastBlockIndex = lastBlockIndex;
    this.timestamp = timestamp;
    this.nonce = nonce;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt32LE(this.lastBlockIndex);
    writer.writeUInt32LE(this.timestamp);
    writer.writeUInt32LE(this.nonce);
  }
}
