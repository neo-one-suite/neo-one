/* @flow */
import type BN from 'bn.js';
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  BinaryReader,
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
    const parts = this.host.split('.');
    let address;
    if (parts.length === 4) {
      address = new Address6(Address6.fromAddress4(this.host).to4in6());
    } else {
      address = new Address6(this.host);
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
      host: address.canonicalForm() || '',
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
