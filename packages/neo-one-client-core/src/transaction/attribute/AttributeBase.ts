import { Attribute } from './Attribute';
import { AttributeUsage, AttributeUsageJSON } from './AttributeUsage';
import { BinaryWriter } from '../../utils';
import { Equatable } from '../../Equatable';
import {
  DeserializeWireBaseOptions,
  SerializeJSONContext,
  SerializableJSON,
  SerializeWire,
  SerializableWire,
  createSerializeWire,
} from '../../Serializable';

export interface AttributeJSON {
  usage: AttributeUsageJSON;
  data: string;
}

export abstract class AttributeBase<Usage extends AttributeUsage, Value>
  implements
    Equatable,
    SerializableWire<Attribute>,
    SerializableJSON<AttributeJSON> {
  public static deserializeAttributeWireBase({
    reader,
  }: DeserializeWireBaseOptions): { usage: number } {
    const usage = reader.readUInt8();
    return { usage };
  }

  public abstract readonly usage: Usage;
  public abstract readonly value: Value;
  public abstract readonly size: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  public readonly equals = (other: {}): boolean => {
    return this === other;
  };

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.usage);
  }

  public serializeJSON(context: SerializeJSONContext): AttributeJSON {
    throw new Error('Not Implemented');
  }
}
