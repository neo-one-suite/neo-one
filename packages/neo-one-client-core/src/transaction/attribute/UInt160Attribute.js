/* @flow */
import AttributeBase, { type AttributeJSON } from './AttributeBase';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../../Serializable';
import type { Equals } from '../../Equatable';
import { InvalidFormatError } from '../../errors';
import { toJSONAttributeUsage } from './AttributeUsage';

import common, { type UInt160 } from '../../common';
import utils, { type BinaryWriter, IOHelper, JSONHelper } from '../../utils';

export type UInt160AttributeUsage = 0x20;

export type UInt160AttributeAdd = {|
  usage: UInt160AttributeUsage,
  value: UInt160,
|};

export default class UInt160Attribute extends AttributeBase<
  UInt160AttributeUsage,
  UInt160,
> {
  constructor({ usage, value }: UInt160AttributeAdd) {
    super();
    this.usage = usage;
    this.value = value;
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt160;
  }

  equals: Equals = utils.equals(
    UInt160Attribute,
    other =>
      this.usage === other.usage &&
      common.uInt160Equal(this.value, other.value),
  );

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt160(this.value);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const { usage } = super.deserializeAttributeWireBase(options);
    if (usage !== 0x20) {
      throw new InvalidFormatError();
    }
    const value = reader.readUInt160();
    return new this({ usage, value });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeUInt160(this.value),
    };
  }
}
