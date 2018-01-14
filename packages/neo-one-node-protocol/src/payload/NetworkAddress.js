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
} from '@neo-one/client-core';

import { Address6 } from 'ip-address';

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
    const address = this.constructor.getAddress6(this.host);
    if (address == null) {
      throw new InvalidFormatError();
    }
    writer.writeUInt32LE(this.timestamp);
    writer.writeUInt64LE(this.services);
    writer.writeBytes(address.toByteArray());
    writer.writeUInt16BE(this.port);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): NetworkAddress {
    const timestamp = reader.readUInt32LE();
    const services = reader.readUInt64LE();
    const address = Address6.fromByteArray([...reader.readBytes(16)]);
    const port = reader.readUInt16BE();
    return new this({
      timestamp,
      services,
      host: address == null ? '' : address.canonicalForm() || '',
      port,
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  static isValid(host: string): boolean {
    const address = this.getAddress6(host);
    if (address == null) {
      return false;
    }

    try {
      address.toByteArray();
      return true;
    } catch (error) {
      return false;
    }
  }

  static getAddress6(host: string): ?Address6 {
    const parts = host.split('.');
    let address;
    if (parts.length === 4) {
      address = Address6.fromAddress4(host);
    } else {
      address = new Address6(host);
    }

    return address;
  }
}
