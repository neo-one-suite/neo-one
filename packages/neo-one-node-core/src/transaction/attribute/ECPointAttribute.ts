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
      throw new InvalidFormatError();
    }
    const value = common.bufferToECPoint(Buffer.concat([Buffer.from([usage]), reader.readBytes(32)]));

    return new this({ usage, value });
  }

  public readonly size: number;

  public constructor({ usage, value }: ECPointAttributeAdd) {
    super({ usage, value });
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfECPoint(this.value);
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeECPoint(this.value),
    };
  }
}
