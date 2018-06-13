import BN from 'bn.js';
import { common, UInt160, UInt256 } from '../common';
import { crypto } from '../crypto';
import { Equals, Equatable } from '../Equatable';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from '../Serializable';
import {
  BinaryReader,
  BinaryWriter,
  IOHelper,
  JSONHelper,
  utils,
} from '../utils';

export interface OutputKey {
  readonly hash: UInt256;
  readonly index: number;
}

export interface OutputAdd {
  asset: UInt256;
  value: BN;
  address: UInt160;
}

export interface OutputJSON {
  n: number;
  asset: string;
  value: string;
  address: string;
}

export class Output implements SerializableWire<Output>, Equatable {
  public static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): Output {
    const asset = reader.readUInt256();
    const value = reader.readFixed8();
    const address = reader.readUInt160();
    return new this({ asset, value, address });
  }

  public static deserializeWire(options: DeserializeWireOptions): Output {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly asset: UInt256;
  public readonly value: BN;
  public readonly address: UInt160;
  public readonly size: number =
    IOHelper.sizeOfUInt256 + IOHelper.sizeOfUInt16LE + IOHelper.sizeOfUInt160;
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );
  public readonly equals: Equals = utils.equals(
    Output,
    (other) =>
      common.uInt256Equal(this.asset, other.asset) &&
      this.value.eq(other.value) &&
      common.uInt160Equal(this.address, other.address),
  );

  constructor({ asset, value, address }: OutputAdd) {
    this.asset = asset;
    this.value = value;
    this.address = address;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.asset);
    writer.writeFixed8(this.value);
    writer.writeUInt160(this.address);
  }

  public serializeJSON(
    context: SerializeJSONContext,
    index: number,
  ): OutputJSON {
    return {
      n: index,
      asset: JSONHelper.writeUInt256(this.asset),
      value: JSONHelper.writeFixed8(this.value),
      address: crypto.scriptHashToAddress({
        addressVersion: context.addressVersion,
        scriptHash: this.address,
      }),
    };
  }
}
