import { BinaryWriter } from '../../../BinaryWriter';
import { UInt160 } from '../../../common';
import { AttributeBaseModel } from './AttributeBaseModel';
import { AttributeUsageModel } from './AttributeUsageModel';

export type UInt160AttributeUsageModel = AttributeUsageModel.Script;

export interface UInt160AttributeModelAdd {
  readonly usage: UInt160AttributeUsageModel;
  readonly value: UInt160;
}

export class UInt160AttributeModel extends AttributeBaseModel<UInt160AttributeUsageModel, UInt160> {
  public readonly usage: UInt160AttributeUsageModel;
  public readonly value: UInt160;

  public constructor({ usage, value }: UInt160AttributeModelAdd) {
    super();
    this.usage = usage;
    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt160(this.value);
  }
}
