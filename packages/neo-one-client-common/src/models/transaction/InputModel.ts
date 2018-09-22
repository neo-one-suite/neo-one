import { BinaryWriter } from '../../BinaryWriter';
import { common, UInt256 } from '../../common';
import { IOHelper } from '../../IOHelper';
import { createSerializeWire, SerializableWire, SerializeWire } from '../Serializable';

export interface InputModelAdd {
  readonly hash: UInt256;
  readonly index: number;
}

const SIZE = IOHelper.sizeOfUInt256 + IOHelper.sizeOfUInt16LE;
export class InputModel implements SerializableWire<InputModel> {
  public static readonly size: number = SIZE;
  public readonly hash: UInt256;
  public readonly hashHex: string;
  public readonly index: number;
  public readonly size: number = SIZE;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ hash, index }: InputModelAdd) {
    this.hash = hash;
    this.hashHex = common.uInt256ToHex(hash);
    this.index = index;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt256(this.hash);
    writer.writeUInt16LE(this.index);
  }
}
