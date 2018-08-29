import { UInt256 } from '../../common';
import { InvalidFormatError } from '../../errors';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../Serializable';
import { BinaryWriter, IOHelper, JSONHelper } from '../../utils';
import { AttributeBase, AttributeJSON } from './AttributeBase';
import { AttributeUsage, toJSONAttributeUsage } from './AttributeUsage';

export type UInt256AttributeUsage =
  | 0x00
  | 0x30
  | 0xa1
  | 0xa2
  | 0xa3
  | 0xa4
  | 0xa5
  | 0xa6
  | 0xa7
  | 0xa8
  | 0xa9
  | 0xaa
  | 0xab
  | 0xac
  | 0xad
  | 0xae
  | 0xaf;

export interface UInt256AttributeAdd {
  readonly usage: UInt256AttributeUsage;
  readonly value: UInt256;
}

export class UInt256Attribute extends AttributeBase<UInt256AttributeUsage, UInt256> {
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
      throw new InvalidFormatError();
    }
    const value = reader.readUInt256();

    return new this({ usage, value });
  }

  public readonly usage: UInt256AttributeUsage;
  public readonly value: UInt256;
  public readonly size: number;

  public constructor({ usage, value }: UInt256AttributeAdd) {
    super();
    this.usage = usage;
    this.value = value;
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt256;
  }
  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt256(this.value);
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeUInt256(this.value),
    };
  }
}
