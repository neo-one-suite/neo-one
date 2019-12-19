import {
  AttributeJSON,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  toJSONAttributeUsage,
  UInt256AttributeModel,
  UInt256AttributeModelAdd as UInt256AttributeAdd,
  UInt256AttributeUsageModel as UInt256AttributeUsage,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../Serializable';
import { AttributeBase } from './AttributeBase';
import { AttributeUsage } from './AttributeUsage';

export { UInt256AttributeUsage, UInt256AttributeAdd };

export class UInt256Attribute extends AttributeBase(UInt256AttributeModel) {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): UInt256Attribute {
    const { reader } = options;
    const { usage } = super.deserializeAttributeWireBase(options);
    if (
      !(
        usage === AttributeUsage.ContractHash ||
        usage === AttributeUsage.Vote ||
        usage === AttributeUsage.Hash1 ||
        usage === AttributeUsage.Hash2 ||
        usage === AttributeUsage.Hash3 ||
        usage === AttributeUsage.Hash4 ||
        usage === AttributeUsage.Hash5 ||
        usage === AttributeUsage.Hash6 ||
        usage === AttributeUsage.Hash7 ||
        usage === AttributeUsage.Hash8 ||
        usage === AttributeUsage.Hash9 ||
        usage === AttributeUsage.Hash10 ||
        usage === AttributeUsage.Hash11 ||
        usage === AttributeUsage.Hash12 ||
        usage === AttributeUsage.Hash13 ||
        usage === AttributeUsage.Hash14 ||
        usage === AttributeUsage.Hash15
      )
    ) {
      throw new InvalidFormatError(`Invalid AttributeUsageModel. Received: ${usage}`);
    }
    const data = reader.readUInt256();

    return new this({ usage, data });
  }

  public readonly size: number;

  public constructor({ usage, data }: UInt256AttributeAdd) {
    super({ usage, data });
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt256;
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeUInt256(this.data),
    };
  }
}
