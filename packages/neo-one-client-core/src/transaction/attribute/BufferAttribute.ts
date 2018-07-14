import { Equals } from '../../Equatable';
import { InvalidFormatError } from '../../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../Serializable';
import { BinaryWriter, IOHelper, JSONHelper, utils } from '../../utils';
import { AttributeBase, AttributeJSON } from './AttributeBase';
import { AttributeUsage, toJSONAttributeUsage } from './AttributeUsage';

export type BufferAttributeUsage =
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

export interface BufferAttributeAdd {
  readonly usage: BufferAttributeUsage;
  readonly value: Buffer;
}

export class BufferAttribute extends AttributeBase<BufferAttributeUsage, Buffer> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): BufferAttribute {
    const { reader } = options;
    const { usage } = super.deserializeAttributeWireBase(options);
    if (
      !(
        usage === AttributeUsage.DescriptionUrl ||
        usage === AttributeUsage.Description ||
        usage === AttributeUsage.Remark ||
        usage === AttributeUsage.Remark1 ||
        usage === AttributeUsage.Remark2 ||
        usage === AttributeUsage.Remark3 ||
        usage === AttributeUsage.Remark4 ||
        usage === AttributeUsage.Remark5 ||
        usage === AttributeUsage.Remark6 ||
        usage === AttributeUsage.Remark7 ||
        usage === AttributeUsage.Remark8 ||
        usage === AttributeUsage.Remark9 ||
        usage === AttributeUsage.Remark10 ||
        usage === AttributeUsage.Remark11 ||
        usage === AttributeUsage.Remark12 ||
        usage === AttributeUsage.Remark13 ||
        usage === AttributeUsage.Remark14 ||
        usage === AttributeUsage.Remark15
      )
    ) {
      throw new InvalidFormatError();
    }
    const value =
      usage === AttributeUsage.DescriptionUrl ? reader.readBytes(reader.readUInt8()) : reader.readVarBytesLE();

    return new BufferAttribute({ usage, value });
  }

  public readonly usage: BufferAttributeUsage;
  public readonly value: Buffer;
  public readonly size: number;
  public readonly equals: Equals = utils.equals(
    BufferAttribute,
    this,
    (other) => this.usage === other.usage && this.value.equals(other.value),
  );

  public constructor({ usage, value }: BufferAttributeAdd) {
    super();
    this.usage = usage;
    this.value = value;
    this.size =
      this.usage === AttributeUsage.DescriptionUrl
        ? IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt8 + this.value.length
        : IOHelper.sizeOfUInt8 + IOHelper.sizeOfVarBytesLE(this.value);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    if (this.usage === AttributeUsage.DescriptionUrl) {
      writer.writeUInt8(this.value.length);
      writer.writeBytes(this.value);
    } else {
      writer.writeVarBytesLE(this.value);
    }
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeBuffer(this.value),
    };
  }
}
