import { AttributeBase, AttributeJSON } from './AttributeBase';
import {
  DeserializeWireBaseOptions,
  SerializeJSONContext,
} from '../../Serializable';
import { Equals } from '../../Equatable';
import { InvalidFormatError } from '../../errors';
import { toJSONAttributeUsage, AttributeUsage } from './AttributeUsage';
import { common, UInt160 } from '../../common';
import { utils, BinaryWriter, IOHelper, JSONHelper } from '../../utils';

export type UInt160AttributeUsage = 0x20;

export interface UInt160AttributeAdd {
  usage: UInt160AttributeUsage;
  value: UInt160;
}

export class UInt160Attribute extends AttributeBase<
  UInt160AttributeUsage,
  UInt160
> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): UInt160Attribute {
    const { reader } = options;
    const { usage } = super.deserializeAttributeWireBase(options);
    if (usage !== AttributeUsage.Script) {
      throw new InvalidFormatError();
    }
    const value = reader.readUInt160();
    return new this({ usage, value });
  }

  public readonly usage: UInt160AttributeUsage;
  public readonly value: UInt160;
  public readonly size: number;
  public readonly equals: Equals = utils.equals(
    UInt160Attribute,
    (other) =>
      this.usage === other.usage &&
      common.uInt160Equal(this.value, other.value),
  );

  constructor({ usage, value }: UInt160AttributeAdd) {
    super();
    this.usage = usage;
    this.value = value;
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt160;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt160(this.value);
  }

  public serializeJSON(context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeUInt160(this.value),
    };
  }
}
