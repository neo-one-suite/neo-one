import { common, ECPoint } from '../../common';
import { InvalidFormatError } from '../../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../Serializable';
import { BinaryWriter, IOHelper, JSONHelper } from '../../utils';
import { AttributeBase, AttributeJSON } from './AttributeBase';
import { AttributeUsage, toJSONAttributeUsage } from './AttributeUsage';

export type ECPointAttributeUsage = 0x02 | 0x03;

export interface ECPointAttributeAdd {
  readonly usage: ECPointAttributeUsage;
  readonly value: ECPoint;
}

export class ECPointAttribute extends AttributeBase<ECPointAttributeUsage, ECPoint> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ECPointAttribute {
    const { reader } = options;
    const { usage } = super.deserializeAttributeWireBase(options);
    if (!(usage === AttributeUsage.ECDH02 || usage === AttributeUsage.ECDH03)) {
      throw new InvalidFormatError();
    }
    const value = common.bufferToECPoint(Buffer.concat([Buffer.from([usage]), reader.readBytes(32)]));

    return new this({ usage, value });
  }

  public readonly usage: ECPointAttributeUsage;
  public readonly value: ECPoint;
  public readonly size: number;

  public constructor({ usage, value }: ECPointAttributeAdd) {
    super();
    this.usage = usage;
    this.value = value;
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfECPoint(this.value);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeBytes(common.ecPointToBuffer(this.value).slice(1));
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeECPoint(this.value),
    };
  }
}
