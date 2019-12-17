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
  readonly data: Buffer;
}

export class BufferAttributeModel extends AttributeBaseModel<BufferAttributeUsageModel, Buffer> {
  public readonly usage: BufferAttributeUsageModel;
  public readonly data: Buffer;

  public constructor({ usage, data }: BufferAttributeModelAdd) {
    super();
    this.usage = usage;
    this.data = data;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    if (this.usage === AttributeUsageModel.DescriptionUrl) {
      writer.writeUInt8(this.data.length);
      writer.writeBytes(this.data);
    } else {
      writer.writeVarBytesLE(this.data);
    }
  }
}
