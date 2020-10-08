import { BinaryWriter, createSerializeWire, InvalidFormatError } from '@neo-one/client-common';
import {
  BinaryReader,
  deserializeNodeCapabilityWireBase,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  NodeCapability,
} from '@neo-one/node-core';

export interface VersionPayloadAdd {
  readonly magic: number;
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
    const magic = reader.readUInt32LE();
    const version = reader.readUInt32LE();
    const timestamp = reader.readUInt32LE();
    const nonce = reader.readUInt32LE();
    const userAgent = reader.readVarString(1024);

    const capabilities = reader.readArray(() => deserializeNodeCapabilityWireBase(options), this.maxCapabilities);

    // TODO: test this is working as intended (checking distinct capabilities)
    if (new Set(capabilities.map((cap) => cap.type)).size !== capabilities.length) {
      throw new InvalidFormatError();
    }

    return new VersionPayload({
      magic,
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
    magic,
    version,
    nonce,
    userAgent,
    capabilities,
  }: Omit<VersionPayloadAdd, 'timestamp'>): VersionPayload {
    return new VersionPayload({
      magic,
      version,
      timestamp: Math.round(Date.now() / 1000),
      nonce,
      userAgent,
      capabilities,
    });
  }

  public readonly magic: number;
  public readonly version: number;
  public readonly timestamp: number;
  public readonly nonce: number;
  public readonly userAgent: string;
  public readonly capabilities: readonly NodeCapability[];

  public readonly serializeWire = createSerializeWire(this.serializeWireBase);

  public constructor({ magic, version, timestamp, nonce, userAgent, capabilities }: VersionPayloadAdd) {
    this.magic = magic;
    this.version = version;
    this.timestamp = timestamp;
    this.nonce = nonce;
    this.userAgent = userAgent;
    this.capabilities = capabilities;
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeUInt32LE(this.magic);
    writer.writeUInt32LE(this.version);
    writer.writeUInt32LE(this.timestamp);
    writer.writeUInt32LE(this.nonce);
    writer.writeVarString(this.userAgent);
    writer.writeArray(this.capabilities, (capability) => capability.serializeWireBase(writer));
  }
}
