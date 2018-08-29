import { UInt160 } from '../../common';
import { InvalidFormatError } from '../../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../Serializable';
import { BinaryWriter, IOHelper, JSONHelper } from '../../utils';
import { AttributeBase, AttributeJSON } from './AttributeBase';
import { AttributeUsage, toJSONAttributeUsage } from './AttributeUsage';

export type UInt160AttributeUsage = 0x20;

export interface UInt160AttributeAdd {
  readonly usage: UInt160AttributeUsage;
  readonly value: UInt160;
}

export class UInt160Attribute extends AttributeBase<UInt160AttributeUsage, UInt160> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): UInt160Attribute {
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

  public constructor({ usage, value }: UInt160AttributeAdd) {
    super();
    this.usage = usage;
    this.value = value;
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt160;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt160(this.value);
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeUInt160(this.value),
    };
  }
}
