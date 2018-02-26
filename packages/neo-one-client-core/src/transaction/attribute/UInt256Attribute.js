/* @flow */
import AttributeBase, { type AttributeJSON } from './AttributeBase';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../../Serializable';
import type { Equals } from '../../Equatable';
import { InvalidFormatError } from '../../errors';
import { toJSONAttributeUsage } from './AttributeUsage';

import common, { type UInt256 } from '../../common';
import utils, { type BinaryWriter, IOHelper, JSONHelper } from '../../utils';

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

export type UInt256AttributeAdd = {|
  usage: UInt256AttributeUsage,
  value: UInt256,
|};

export default class UInt256Attribute extends AttributeBase<
  UInt256AttributeUsage,
  UInt256,
> {
  constructor({ usage, value }: UInt256AttributeAdd) {
    super();
    this.usage = usage;
    this.value = value;
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt256;
  }

  equals: Equals = utils.equals(
    UInt256Attribute,
    other =>
      this.usage === other.usage &&
      common.uInt256Equal(this.value, other.value),
  );

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt256(this.value);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const { usage } = super.deserializeAttributeWireBase(options);
    if (
      !(
        usage === 0x00 ||
        usage === 0x30 ||
        usage === 0xa1 ||
        usage === 0xa2 ||
        usage === 0xa3 ||
        usage === 0xa4 ||
        usage === 0xa5 ||
        usage === 0xa6 ||
        usage === 0xa7 ||
        usage === 0xa8 ||
        usage === 0xa9 ||
        usage === 0xaa ||
        usage === 0xab ||
        usage === 0xac ||
        usage === 0xad ||
        usage === 0xae ||
        usage === 0xaf
      )
    ) {
      throw new InvalidFormatError();
    }
    const value = reader.readUInt256();
    return new this({ usage, value });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeUInt256(this.value),
    };
  }
}
