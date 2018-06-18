import {
  BinaryReader,
  BinaryWriter,
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-core';
import { NetworkAddress } from './NetworkAddress';
export interface AddrPayloadAdd {
  readonly addresses: ReadonlyArray<NetworkAddress>;
}

export class AddrPayload implements SerializableWire<AddrPayload> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): AddrPayload {
    const { reader } = options;
    const addresses = reader.readArray(() => NetworkAddress.deserializeWireBase(options));

    return new this({ addresses });
  }

  public static deserializeWire(options: DeserializeWireOptions): AddrPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly addresses: ReadonlyArray<NetworkAddress>;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ addresses }: AddrPayloadAdd) {
    this.addresses = addresses;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeArray(this.addresses, (address) => address.serializeWireBase(writer));
  }
}
