import { BN } from 'bn.js';
import { common, UInt160, UInt256 } from '../common';
import { crypto } from '../crypto';
import { Equals, EquatableKey } from '../Equatable';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from '../Serializable';
import { BinaryReader, BinaryWriter, IOHelper, JSONHelper, utils } from '../utils';

export interface OutputKey {
  readonly hash: UInt256;
  readonly index: number;
}

export interface OutputAdd {
  readonly asset: UInt256;
  readonly value: BN;
  readonly address: UInt160;
}

export interface OutputJSON {
  readonly n: number;
  readonly asset: string;
  readonly value: string;
  readonly address: string;
}

const SIZE = IOHelper.sizeOfUInt256 + IOHelper.sizeOfFixed8 + IOHelper.sizeOfUInt160;
export class Output implements SerializableWire<Output>, EquatableKey {
  public static readonly size: number = SIZE;
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): Output {
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
  public readonly size: number = SIZE;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  public readonly equals: Equals = utils.equals(
    Output,
    this,
    (other) =>
      common.uInt256Equal(this.asset, other.asset) &&
      this.value.eq(other.value) &&
      common.uInt160Equal(this.address, other.address),
  );
  public readonly toKeyString = utils.toKeyString(
    Output,
    () => `${common.uInt256ToString(this.asset)}:${this.value.toString(10)}:${common.uInt160ToString(this.address)}`,
  );

  public constructor({ asset, value, address }: OutputAdd) {
    this.asset = asset;
    this.value = value;
    this.address = address;
  }

  public clone({ value = this.value }: { readonly value?: BN }): Output {
    return new Output({
      asset: this.asset,
      value,
      address: this.address,
    });
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.asset);
    writer.writeFixed8(this.value);
    writer.writeUInt160(this.address);
  }

  public serializeJSON(context: SerializeJSONContext, index: number): OutputJSON {
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
