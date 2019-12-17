import { BinaryWriter } from '../../../BinaryWriter';
import { UInt160 } from '../../../common';
import { AttributeBaseModel } from './AttributeBaseModel';

export type UInt160AttributeUsageModel = 0x20;

export interface UInt160AttributeModelAdd {
  readonly usage: UInt160AttributeUsageModel;
  readonly data: UInt160;
}

export class UInt160AttributeModel extends AttributeBaseModel<UInt160AttributeUsageModel, UInt160> {
  public readonly usage: UInt160AttributeUsageModel;
  public readonly data: UInt160;

  public constructor({ usage, data }: UInt160AttributeModelAdd) {
    super();
    this.usage = usage;
    this.data = data;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt160(this.data);
  }
}
