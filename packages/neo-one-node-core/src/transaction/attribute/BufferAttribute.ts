import {
  AttributeJSON,
  BufferAttributeModel,
  BufferAttributeModelAdd as BufferAttributeAdd,
  BufferAttributeUsageModel as BufferAttributeUsage,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  toJSONAttributeUsage,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../Serializable';
import { AttributeBase } from './AttributeBase';
import { AttributeUsage } from './AttributeUsage';

export { BufferAttributeAdd, BufferAttributeUsage };

export class BufferAttribute extends AttributeBase(BufferAttributeModel) {
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
      throw new InvalidFormatError(`Invalid AttributeUsageModel. Received: ${usage}`);
    }
    const data =
      usage === AttributeUsage.DescriptionUrl ? reader.readBytes(reader.readUInt8()) : reader.readVarBytesLE();

    return new BufferAttribute({ usage, data });
  }

  public readonly size: number;

  public constructor({ usage, data }: BufferAttributeAdd) {
    super({ usage, data });
    this.size =
      this.usage === AttributeUsage.DescriptionUrl
        ? IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt8 + this.data.length
        : IOHelper.sizeOfUInt8 + IOHelper.sizeOfVarBytesLE(this.data);
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeBuffer(this.data),
    };
  }
}
