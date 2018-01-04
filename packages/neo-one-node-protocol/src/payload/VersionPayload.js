/* @flow */
import BN from 'bn.js';
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  BinaryReader,
  createSerializeWire,
} from '@neo-one/client-core';

export const SERVICES = {
  NODE_NETWORK: new BN(1),
};

export type VersionPayloadAdd = {|
  protocolVersion: number,
  services: BN,
  timestamp: number,
  port: number,
  nonce: number,
  userAgent: string,
  startHeight: number,
  relay: boolean,
|};

export default class VersionPayload
  implements SerializableWire<VersionPayload> {
  protocolVersion: number;
  services: BN;
  timestamp: number;
  port: number;
  nonce: number;
  userAgent: string;
  startHeight: number;
  relay: boolean;

  constructor({
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

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt32LE(this.protocolVersion);
    writer.writeUInt64LE(this.services);
    writer.writeUInt32LE(this.timestamp);
    writer.writeUInt16LE(this.port);
    writer.writeUInt32LE(this.nonce);
    writer.writeVarString(this.userAgent);
    writer.writeUInt32LE(this.startHeight);
    writer.writeBoolean(this.relay);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): VersionPayload {
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

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
