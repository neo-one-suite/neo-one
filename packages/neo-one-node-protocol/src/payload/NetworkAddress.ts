import {
  BinaryWriter,
  createSerializeWire,
  InvalidFormatError,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';
import {
  assertServerCapability,
  BinaryReader,
  createEndpoint,
  deserializeNodeCapabilityWireBase,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  NodeCapability,
  NodeCapabilityType,
  utils,
} from '@neo-one/node-core';
import { Address6 } from 'ip-address';
import { VersionPayload } from './VersionPayload';

export interface NetworkAddressAdd {
  readonly timestamp: number;
  readonly address: string;
  readonly capabilities: readonly NodeCapability[];
}

const BYTE_LENGTH = 16;

export class NetworkAddress implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): NetworkAddress {
    const { reader } = options;
    const timestamp = reader.readUInt32LE();

    const address = Address6.fromByteArray([...reader.readBytes(BYTE_LENGTH)]) as Address6 | undefined | null;
    const canonical = address == undefined ? '' : (address.canonicalForm() as string | undefined | null);

    const capabilities = reader.readArray(
      () => deserializeNodeCapabilityWireBase(options),
      VersionPayload.maxCapabilities,
    );

    if (new Set(capabilities.map((cap) => cap.type)).size !== capabilities.length) {
      // TODO: implement new error same as VersionPayload
      throw new InvalidFormatError();
    }

    return new this({
      timestamp,
      address: canonical == undefined ? '' : canonical,
      capabilities,
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

  public readonly timestamp: number;
  public readonly address: string;
  public readonly capabilities: readonly NodeCapability[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ timestamp, address, capabilities }: NetworkAddressAdd) {
    this.timestamp = timestamp;
    this.address = address;
    this.capabilities = capabilities;
  }

  public get endpoint() {
    return utils.lazy(() => this.getEndpointInternal())();
  }

  public get port() {
    return utils.lazy(() => this.getPortInternal())();
  }

  public serializeWireBase(writer: BinaryWriter): void {
    const address = NetworkAddress.getAddress6(this.address);
    if (address == undefined) {
      throw new InvalidFormatError('Network IP address undefined');
    }

    writer.writeUInt32LE(this.timestamp);

    const addressSerialized = Buffer.from(address.toByteArray());
    writer.writeBytes(Buffer.concat([Buffer.alloc(BYTE_LENGTH - addressSerialized.length, 0), addressSerialized]));

    writer.writeArray(this.capabilities, (cap) => cap.serializeWireBase(writer));
  }

  private getPortInternal() {
    const tcpCapabilities = this.capabilities
      .filter((cap) => cap.type === NodeCapabilityType.TcpServer)
      .map(assertServerCapability);

    return tcpCapabilities[0]?.port ?? 0;
  }

  private getEndpointInternal() {
    return createEndpoint({ type: 'tcp', host: this.address, port: this.port });
  }
}
