/* @flow */
import AttributeBase, { type AttributeJSON } from './AttributeBase';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../../Serializable';
import type { Equals } from '../../Equatable';
import { InvalidFormatError } from '../../errors';
import { toJSONAttributeUsage } from './AttributeUsage';

import utils, { type BinaryWriter, IOHelper, JSONHelper } from '../../utils';

export type BufferAttributeUsage =
  | 0x81
  | 0x90
  | 0xf0
  | 0xf1
  | 0xf2
  | 0xf3
  | 0xf4
  | 0xf5
  | 0xf6
  | 0xf7
  | 0xf8
  | 0xf9
  | 0xfa
  | 0xfb
  | 0xfc
  | 0xfd
  | 0xfe
  | 0xff;

export type BufferAttributeAdd = {|
  usage: BufferAttributeUsage,
  value: Buffer,
|};

export default class BufferAttribute extends AttributeBase<
  BufferAttributeUsage,
  Buffer,
> {
  constructor({ usage, value }: BufferAttributeAdd) {
    super();
    this.usage = usage;
    this.value = value;
    if (this.usage === 0x81) {
      this.size =
        IOHelper.sizeOfUInt8 + IOHelper.sizeOfUInt8 + this.value.length;
    } else {
      this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfVarBytesLE(this.value);
    }
  }

  equals: Equals = utils.equals(
    BufferAttribute,
    other => this.usage === other.usage && this.value.equals(other.value),
  );

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    if (this.usage === 0x81) {
      writer.writeUInt8(this.value.length);
      writer.writeBytes(this.value);
    } else {
      writer.writeVarBytesLE(this.value);
    }
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const { usage } = super.deserializeAttributeWireBase(options);
    if (
      !(
        usage === 0x81 ||
        usage === 0x90 ||
        usage === 0xf0 ||
        usage === 0xf1 ||
        usage === 0xf2 ||
        usage === 0xf3 ||
        usage === 0xf4 ||
        usage === 0xf5 ||
        usage === 0xf6 ||
        usage === 0xf7 ||
        usage === 0xf8 ||
        usage === 0xf9 ||
        usage === 0xfa ||
        usage === 0xfb ||
        usage === 0xfc ||
        usage === 0xfd ||
        usage === 0xfe ||
        usage === 0xff
      )
    ) {
      throw new InvalidFormatError();
    }
    let value;
    if (usage === 0x81) {
      value = reader.readBytes(reader.readUInt8());
    } else {
      value = reader.readVarBytesLE();
    }

    return new this({ usage, value });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeBuffer(this.value),
    };
  }
}
