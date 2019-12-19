import {
  AttributeJSON,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  toJSONAttributeUsage,
  UInt160AttributeModel,
  UInt160AttributeModelAdd as UInt160AttributeAdd,
  UInt160AttributeUsageModel as UInt160AttributeUsage,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../Serializable';
import { AttributeBase } from './AttributeBase';
import { AttributeUsage } from './AttributeUsage';

// tslint:disable-next-line export-name
export { UInt160AttributeUsage, UInt160AttributeAdd };

export class UInt160Attribute extends AttributeBase(UInt160AttributeModel) {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): UInt160Attribute {
    const { reader } = options;
    const { usage } = super.deserializeAttributeWireBase(options);
    if (usage !== AttributeUsage.Script) {
      throw new InvalidFormatError(`Expected attribute usage to be ${AttributeUsage.Script}. Received: ${usage}`);
    }
    const data = reader.readUInt160();

    return new this({ usage, data });
  }

  public readonly size: number;

  public constructor({ usage, data }: UInt160AttributeAdd) {
    super({ usage, data });
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt160;
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeUInt160(this.data),
    };
  }
}
