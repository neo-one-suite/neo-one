import { Equatable } from '../../Equatable';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from '../../Serializable';
import { BinaryWriter } from '../../utils';
import { Attribute } from './Attribute';
import { AttributeUsage, AttributeUsageJSON } from './AttributeUsage';

export interface AttributeJSON {
  readonly usage: AttributeUsageJSON;
  readonly data: string;
}

export abstract class AttributeBase<Usage extends AttributeUsage, Value>
  implements Equatable, SerializableWire<Attribute>, SerializableJSON<AttributeJSON> {
  public static deserializeAttributeWireBase({ reader }: DeserializeWireBaseOptions): { readonly usage: number } {
    const usage = reader.readUInt8();

    return { usage };
  }

  public abstract readonly usage: Usage;
  public abstract readonly value: Value;
  public abstract readonly size: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public readonly equals = (other: {}): boolean => this === other;

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.usage);
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    throw new Error('Not Implemented');
  }
}
