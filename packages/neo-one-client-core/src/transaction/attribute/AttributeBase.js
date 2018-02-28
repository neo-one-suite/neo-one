/* @flow */
import type { Attribute } from './Attribute';
import type { AttributeUsage, AttributeUsageJSON } from './AttributeUsage';
import { BinaryReader, type BinaryWriter } from '../../utils';
import type { Equatable } from '../../Equatable';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeJSONContext,
  type SerializableJSON,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from '../../Serializable';

export type AttributeJSON = {|
  usage: AttributeUsageJSON,
  data: string,
|};

export default class AttributeBase<Usage: AttributeUsage, Value>
  implements
    Equatable,
    SerializableWire<Attribute>,
    SerializableJSON<AttributeJSON> {
  usage: Usage;
  value: Value;
  size: number;

  equals(other: mixed): boolean {
    return this === other;
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.usage);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeAttributeWireBase({
    reader,
  }: DeserializeWireBaseOptions): {| usage: number |} {
    const usage = reader.readUInt8();
    return { usage };
  }

  // eslint-disable-next-line
  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    throw new Error('Not Implemented');
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): AttributeJSON {
    throw new Error('Not Implemented');
  }
}
