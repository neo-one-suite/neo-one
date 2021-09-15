import { BinaryWriter, createSerializeWire, InvalidFormatError } from '@neo-one/client-common';
import {
  BinaryReader,
  deserializeNodeCapabilityWireBase,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  NodeCapability,
} from '@neo-one/node-core';
import { Set } from 'immutable';

export interface VersionPayloadAdd {
  readonly network: number;
  readonly version: number;
  readonly timestamp: number;
  readonly nonce: number;
  readonly userAgent: string;
  readonly capabilities: readonly NodeCapability[];
}

export class VersionPayload {
  public static readonly maxCapabilities = 32;
  public static deserializeWireBase(options: DeserializeWireBaseOptions): VersionPayload {
    const { reader } = options;
    const network = reader.readUInt32LE();
    const version = reader.readUInt32LE();
    const timestamp = reader.readUInt32LE();
    const nonce = reader.readUInt32LE();
    const userAgent = reader.readVarString(1024);

    const capabilities = reader.readArray(() => deserializeNodeCapabilityWireBase(options), this.maxCapabilities);

    if (Set(capabilities).size !== capabilities.length) {
      throw new InvalidFormatError('Capabilities has a duplicate in VersionPayload');
    }

    return new VersionPayload({
      network,
      version,
      timestamp,
      nonce,
      userAgent,
      capabilities,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): VersionPayload {
    return this.deserializeWireBase({
      reader: new BinaryReader(options.buffer),
      context: options.context,
    });
  }

  public static create({
    network,
    version,
    nonce,
    userAgent,
    capabilities,
  }: Omit<VersionPayloadAdd, 'timestamp'>): VersionPayload {
    return new VersionPayload({
      network,
      version,
      timestamp: Math.round(Date.now() / 1000),
      nonce,
      userAgent,
      capabilities,
    });
  }

  public readonly network: number;
  public readonly version: number;
  public readonly timestamp: number;
  public readonly nonce: number;
  public readonly userAgent: string;
  public readonly capabilities: readonly NodeCapability[];

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ network, version, timestamp, nonce, userAgent, capabilities }: VersionPayloadAdd) {
    this.network = network;
    this.version = version;
    this.timestamp = timestamp;
    this.nonce = nonce;
    this.userAgent = userAgent;
    this.capabilities = capabilities;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt32LE(this.network);
    writer.writeUInt32LE(this.version);
    writer.writeUInt32LE(this.timestamp);
    writer.writeUInt32LE(this.nonce);
    writer.writeVarString(this.userAgent);
    writer.writeArray(this.capabilities, (capability) => capability.serializeWireBase(writer));
  }
}
