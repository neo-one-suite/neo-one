import { BinaryWriter } from '../../../BinaryWriter';
import { AttributeBaseModel } from './AttributeBaseModel';
import { AttributeUsageModel } from './AttributeUsageModel';

export type BufferAttributeUsageModel =
  | 0x81
  | 0x90
  | 0xf0
  | 0xf1
  | 0xf2
  | 0xf3
  | 0xf4
  | 0xf5
  | 0xf6
  | 0xf7
  | 0xf8
  | 0xf9
  | 0xfa
  | 0xfb
  | 0xfc
  | 0xfd
  | 0xfe
  | 0xff;

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
