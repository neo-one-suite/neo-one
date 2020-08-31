import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions } from '@neo-one/node-core';
import { BN } from 'bn.js';

export const SERVICES = {
  NODE_NETWORK: new BN(1),
};
export interface VersionPayloadAdd {
  readonly protocolVersion: number;
  readonly services: BN;
  readonly timestamp: number;
  readonly port: number;
  readonly nonce: number;
  readonly userAgent: string;
  readonly startHeight: number;
  readonly relay: boolean;
}

export class VersionPayload implements SerializableWire {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): VersionPayload {
    const protocolVersion = reader.readUInt32LE();
    const services = reader.readUInt64LE();
    const timestamp = reader.readUInt32LE();
    const port = reader.readUInt16LE();
    const nonce = reader.readUInt32LE();
    const userAgent = reader.readVarString(1024);
    const startHeight = reader.readUInt32LE();
    const relay = reader.readBoolean();

    return new this({
      protocolVersion,
      services,
      timestamp,
      port,
      nonce,
      userAgent,
      startHeight,
      relay,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): VersionPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly protocolVersion: number;
  public readonly services: BN;
  public readonly timestamp: number;
  public readonly port: number;
  public readonly nonce: number;
  public readonly userAgent: string;
  public readonly startHeight: number;
  public readonly relay: boolean;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({
    protocolVersion,
    services,
    timestamp,
    port,
    nonce,
    userAgent,
    startHeight,
    relay,
  }: VersionPayloadAdd) {
    this.protocolVersion = protocolVersion;
    this.services = services;
    this.timestamp = timestamp;
    this.port = port;
    this.nonce = nonce;
    this.userAgent = userAgent;
    this.startHeight = startHeight;
    this.relay = relay;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.protocolVersion);
    writer.writeUInt64LE(this.services);
    writer.writeUInt32LE(this.timestamp);
    writer.writeUInt16LE(this.port);
    writer.writeUInt32LE(this.nonce);
    writer.writeVarString(this.userAgent);
    writer.writeUInt32LE(this.startHeight);
    writer.writeBoolean(this.relay);
  }
}
