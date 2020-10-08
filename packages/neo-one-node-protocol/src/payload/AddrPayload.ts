import {
  BinaryWriter,
  createSerializeWire,
  InvalidFormatError,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';
import { BinaryReader, DeserializeWireBaseOptions, DeserializeWireOptions } from '@neo-one/node-core';
import { NetworkAddress } from './NetworkAddress';
export interface AddrPayloadAdd {
  readonly addressList: readonly NetworkAddress[];
}

export class AddrPayload implements SerializableWire {
  public static readonly maxCountToSend = 200;
  public static deserializeWireBase(options: DeserializeWireBaseOptions): AddrPayload {
    const { reader } = options;
    const addressList = reader.readArray(() => NetworkAddress.deserializeWireBase(options));

    if (addressList.length === 0) {
      throw new InvalidFormatError();
    }

    return new this({ addressList });
  }

  public static deserializeWire(options: DeserializeWireOptions): AddrPayload {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly addressList: readonly NetworkAddress[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ addressList }: AddrPayloadAdd) {
    this.addressList = addressList;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeArray(this.addressList, (address) => address.serializeWireBase(writer));
  }
}
