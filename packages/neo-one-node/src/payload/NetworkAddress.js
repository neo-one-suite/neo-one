/* @flow */
import type BN from 'bn.js';
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  BinaryReader,
  InvalidFormatError,
  createSerializeWire,
} from '@neo-one/core';

export type NetworkAddressAdd = {|
  host: string,
  port: number,
  timestamp: number,
  services: BN,
|};

export default class NetworkAddress
  implements SerializableWire<NetworkAddress> {
  host: string;
  port: number;
  timestamp: number;
  services: BN;

  constructor({ host, port, timestamp, services }: NetworkAddressAdd) {
    this.host = host;
    this.port = port;
    this.timestamp = timestamp;
    this.services = services;
  }

  serializeWireBase(writer: BinaryWriter): void {
    // TODO: Support non-ipv4 addresses
    const parts = this.host.split('.');
    if (parts.length !== 4) {
      throw new InvalidFormatError();
    }
    const host = Buffer.from(parts.map(part => parseInt(part, 10)));

    writer.writeUInt32LE(this.timestamp);
    writer.writeUInt64LE(this.services);
    writer.writeBytes(host);
    // TODO: NEO node reverses endianness of machine, so this is
    //       technically not well-defined. Let's assume it's always
    //       trying to write little endian values.
    writer.writeUInt16LE(this.port);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): NetworkAddress {
    const timestamp = reader.readUInt32LE();
    const services = reader.readUInt64LE();
    const host0 = reader.readUInt8();
    const host1 = reader.readUInt8();
    const host2 = reader.readUInt8();
    const host3 = reader.readUInt8();
    const port = reader.readUInt16LE();
    return new this({
      timestamp,
      services,
      host: [host0, host1, host2, host3].join('.'),
      port,
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
