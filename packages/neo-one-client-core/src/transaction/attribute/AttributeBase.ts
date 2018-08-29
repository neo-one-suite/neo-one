import { Equals, EquatableKey, ToKeyString } from '../../Equatable';
import {
  createSerializeWire,
  DeserializeWireBaseOptions,
  SerializableJSON,
  SerializableWire,
  SerializeJSONContext,
  SerializeWire,
} from '../../Serializable';
import { BinaryWriter, utils } from '../../utils';
import { Attribute } from './Attribute';
import { AttributeUsage, AttributeUsageJSON } from './AttributeUsage';

export interface AttributeJSON {
  readonly usage: AttributeUsageJSON;
  readonly data: string;
}

export abstract class AttributeBase<Usage extends AttributeUsage, Value extends Buffer>
  implements EquatableKey, SerializableWire<Attribute>, SerializableJSON<AttributeJSON> {
  public static deserializeAttributeWireBase({ reader }: DeserializeWireBaseOptions): { readonly usage: number } {
    const usage = reader.readUInt8();

    return { usage };
  }

  public abstract readonly usage: Usage;
  public abstract readonly value: Value;
  public abstract readonly size: number;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public readonly equals: Equals = utils.equals(
    // tslint:disable-next-line no-any
    AttributeBase as any,
    this,
    (other: AttributeBase<AttributeUsage, Buffer>) => this.usage === other.usage && this.value.equals(other.value),
  );
  public readonly toKeyString: ToKeyString = () => `${AttributeBase.name}:${this.usage}:${this.value.toString('hex')}`;

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.usage);
  }

  public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
    throw new Error('Not Implemented');
  }
}
