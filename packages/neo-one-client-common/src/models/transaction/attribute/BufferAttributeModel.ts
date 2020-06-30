import { BinaryWriter } from '../../../BinaryWriter';
import { AttributeBaseModel } from './AttributeBaseModel';
import { AttributeUsageModel } from './AttributeUsageModel';

export type BufferAttributeUsageModel =
  | AttributeUsageModel.DescriptionUrl
  | AttributeUsageModel.Description
  | AttributeUsageModel.Remark
  | AttributeUsageModel.Remark1
  | AttributeUsageModel.Remark2
  | AttributeUsageModel.Remark3
  | AttributeUsageModel.Remark4
  | AttributeUsageModel.Remark5
  | AttributeUsageModel.Remark6
  | AttributeUsageModel.Remark7
  | AttributeUsageModel.Remark8
  | AttributeUsageModel.Remark9
  | AttributeUsageModel.Remark10
  | AttributeUsageModel.Remark11
  | AttributeUsageModel.Remark12
  | AttributeUsageModel.Remark13
  | AttributeUsageModel.Remark14
  | AttributeUsageModel.Remark15;

export interface BufferAttributeModelAdd {
  readonly usage: BufferAttributeUsageModel;
  readonly value: Buffer;
}

export class BufferAttributeModel extends AttributeBaseModel<BufferAttributeUsageModel, Buffer> {
  public readonly usage: BufferAttributeUsageModel;
  public readonly value: Buffer;

  public constructor({ usage, value }: BufferAttributeModelAdd) {
    super();
    this.usage = usage;
    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    if (this.usage === AttributeUsageModel.DescriptionUrl) {
      writer.writeUInt8(this.value.length);
      writer.writeBytes(this.value);
    } else {
      writer.writeVarBytesLE(this.value);
    }
  }
}
