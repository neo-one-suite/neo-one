/* @flow */
import {
  type BinaryWriter,
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeWire,
  type SerializableWire,
  BinaryReader,
  createSerializeWire,
} from '@neo-one/client-core';

import NetworkAddress from './NetworkAddress';

export type AddrPayloadAdd = {|
  addresses: Array<NetworkAddress>,
|};

export default class AddrPayload implements SerializableWire<AddrPayload> {
  addresses: Array<NetworkAddress>;

  constructor({ addresses }: AddrPayloadAdd) {
    this.addresses = addresses;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeArray(this.addresses, address =>
      address.serializeWireBase(writer),
    );
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase(options: DeserializeWireBaseOptions): AddrPayload {
    const { reader } = options;
    const addresses = reader.readArray(() =>
      NetworkAddress.deserializeWireBase(options),
    );

    return new this({ addresses });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }
}
