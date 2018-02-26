/* @flow */
import AttributeBase, { type AttributeJSON } from './AttributeBase';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../../Serializable';
import type { Equals } from '../../Equatable';
import { InvalidFormatError } from '../../errors';
import { toJSONAttributeUsage } from './AttributeUsage';

import common, { type ECPoint } from '../../common';
import utils, { type BinaryWriter, IOHelper, JSONHelper } from '../../utils';

export type ECPointAttributeUsage = 0x02 | 0x03;

export type ECPointAttributeAdd = {|
  usage: ECPointAttributeUsage,
  value: ECPoint,
|};

export default class ECPointAttribute extends AttributeBase<
  ECPointAttributeUsage,
  ECPoint,
> {
  constructor({ usage, value }: ECPointAttributeAdd) {
    super();
    this.usage = usage;
    this.value = value;
    this.size = IOHelper.sizeOfUInt8 + IOHelper.sizeOfECPoint(this.value);
  }

  equals: Equals = utils.equals(
    ECPointAttribute,
    other =>
      this.usage === other.usage &&
      common.ecPointEqual(this.value, other.value),
  );

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeBytes(common.ecPointToBuffer(this.value).slice(1));
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    const { usage } = super.deserializeAttributeWireBase(options);
    if (!(usage === 0x02 || usage === 0x03)) {
      throw new InvalidFormatError();
    }
    const value = common.bufferToECPoint(
      Buffer.concat([Buffer.from([usage]), reader.readBytes(32)]),
    );
    return new this({ usage, value });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): AttributeJSON {
    return {
      usage: toJSONAttributeUsage(this.usage),
      data: JSONHelper.writeECPoint(this.value),
    };
  }
}
