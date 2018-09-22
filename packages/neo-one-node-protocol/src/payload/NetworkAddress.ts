import {
  BinaryWriter,
  createSerializeWire,
  InvalidFormatError,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions } from '@neo-one/node-core';
import BN from 'bn.js';
import { Address6 } from 'ip-address';

export interface NetworkAddressAdd {
  readonly host: string;
  readonly port: number;
  readonly timestamp: number;
  readonly services: BN;
}

const BYTE_LENGTH = 16;

export class NetworkAddress implements SerializableWire<NetworkAddress> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): NetworkAddress {
    const timestamp = reader.readUInt32LE();
    const services = reader.readUInt64LE();
    const address = Address6.fromByteArray([...reader.readBytes(16)]) as Address6 | undefined | null;
    const port = reader.readUInt16BE();

    const canonical = address == undefined ? '' : (address.canonicalForm() as string | undefined | null);

    return new this({
      timestamp,
      services,
      host: canonical == undefined ? '' : canonical,
      port,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): NetworkAddress {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public static isValid(host: string): boolean {
    const address = this.getAddress6(host);
    if (address == undefined) {
      return false;
    }

    try {
      address.toByteArray();

      return true;
    } catch {
      return false;
    }
  }

  public static getAddress6(host: string): Address6 | null | undefined {
    const parts = host.split('.');

    return parts.length === 4 ? Address6.fromAddress4(host) : new Address6(host);
  }

  public readonly host: string;
  public readonly port: number;
  public readonly timestamp: number;
  public readonly services: BN;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ host, port, timestamp, services }: NetworkAddressAdd) {
    this.host = host;
    this.port = port;
    this.timestamp = timestamp;
    this.services = services;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    const address = NetworkAddress.getAddress6(this.host);
    if (address == undefined) {
      throw new InvalidFormatError();
    }
    writer.writeUInt32LE(this.timestamp);
    writer.writeUInt64LE(this.services);
    const addressSerialized = Buffer.from(address.toByteArray());
    writer.writeBytes(Buffer.concat([Buffer.alloc(BYTE_LENGTH - addressSerialized.length, 0), addressSerialized]));
    writer.writeUInt16BE(this.port);
  }
}
