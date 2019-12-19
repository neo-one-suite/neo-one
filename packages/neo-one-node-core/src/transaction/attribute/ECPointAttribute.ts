import {
  AttributeJSON,
  common,
  ECPointAttributeModel,
  ECPointAttributeModelAdd as ECPointAttributeAdd,
  ECPointAttributeUsageModel as ECPointAttributeUsage,
  InvalidFormatError,
  IOHelper,
  JSONHelper,
  toJSONAttributeUsage,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../Serializable';
import { AttributeBase } from './AttributeBase';
import { AttributeUsage } from './AttributeUsage';

export { ECPointAttributeUsage, ECPointAttributeAdd };

export class ECPointAttribute extends AttributeBase(ECPointAttributeModel) {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ECPointAttribute {
    const { reader } = options;
    const { usage } = super.deserializeAttributeWireBase(options);
    if (!(usage === AttributeUsage.ECDH02 || usage === AttributeUsage.ECDH03)) {
      throw new InvalidFormatError(
        `Expected attribute usage to be ${AttributeUsage.ECDH02} or ${AttributeUsage.ECDH03}. Received: ${usage}`,
      );
    }
    const data = common.bufferToECPoint(Buffer.concat([Buffer.from([usage]), reader.readBytes(32)]));

    return new this({ usage, data });
  }

  public readonly size: number;

  public constructor({ usage, data }: ECPointAttributeAdd) {
    super({ usage, data });
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfECPoint(this.data);
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeECPoint(this.data),
    };
  }
}
