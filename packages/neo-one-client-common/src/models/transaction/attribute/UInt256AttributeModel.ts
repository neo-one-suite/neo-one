import { BinaryWriter } from '../../../BinaryWriter';
import { UInt256 } from '../../../common';
import { AttributeBaseModel } from './AttributeBaseModel';

export type UInt256AttributeUsageModel =
  | 0x00
  | 0x30
  | 0xa1
  | 0xa2
  | 0xa3
  | 0xa4
  | 0xa5
  | 0xa6
  | 0xa7
  | 0xa8
  | 0xa9
  | 0xaa
  | 0xab
  | 0xac
  | 0xad
  | 0xae
  | 0xaf;

export interface UInt256AttributeModelAdd {
  readonly usage: UInt256AttributeUsageModel;
  readonly data: UInt256;
}

export class UInt256AttributeModel extends AttributeBaseModel<UInt256AttributeUsageModel, UInt256> {
  public readonly usage: UInt256AttributeUsageModel;
  public readonly data: UInt256;

  public constructor({ usage, data }: UInt256AttributeModelAdd) {
    super();
    this.usage = usage;
    this.data = data;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt256(this.data);
  }
}
