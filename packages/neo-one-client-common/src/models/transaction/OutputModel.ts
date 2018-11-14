import BN from 'bn.js';
import { BinaryWriter } from '../../BinaryWriter';
import { UInt160, UInt256 } from '../../common';
import { IOHelper } from '../../IOHelper';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';

export interface OutputModelKey {
  readonly hash: UInt256;
  readonly index: number;
}

export interface OutputModelAdd {
  readonly asset: UInt256;
  readonly value: BN;
  readonly address: UInt160;
}

const SIZE = IOHelper.sizeOfUInt256 + IOHelper.sizeOfFixed8 + IOHelper.sizeOfUInt160;
export class OutputModel implements SerializableWire<OutputModel> {
  public static readonly size: number = SIZE;
  public readonly asset: UInt256;
  public readonly value: BN;
  public readonly address: UInt160;
  public readonly size: number = SIZE;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ asset, value, address }: OutputModelAdd) {
    this.asset = asset;
    this.value = value;
    this.address = address;
  }

  public clone({ value = this.value }: { readonly value?: BN }): OutputModel {
    return new OutputModel({
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
}
