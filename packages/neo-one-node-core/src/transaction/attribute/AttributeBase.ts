import { AttributeBaseModel, AttributeJSON } from '@neo-one/client-common';
import { Constructor } from '@neo-one/utils';
import { Equals, EquatableKey, ToKeyString } from '../../Equatable';
import { DeserializeWireBaseOptions, SerializableJSON, SerializeJSONContext } from '../../Serializable';
import { utils } from '../../utils';
import { AttributeUsage } from './AttributeUsage';

export function AttributeBase<
  Usage extends AttributeUsage,
  Data extends Buffer,
  TBase extends Constructor<AttributeBaseModel<Usage, Data>>
>(Base: TBase) {
  abstract class AttributeBaseClass extends Base implements EquatableKey, SerializableJSON<AttributeJSON> {
    public static deserializeAttributeWireBase({ reader }: DeserializeWireBaseOptions): { readonly usage: number } {
      const usage = reader.readUInt8();

      return { usage };
    }

    public abstract readonly size: number;
    public readonly equals: Equals = utils.equals(
      // tslint:disable-next-line no-any
      AttributeBaseClass as any,
      this,
      (other: AttributeBaseClass) => this.usage === other.usage && this.data.equals(other.data),
    );
    public readonly toKeyString: ToKeyString = () =>
      `${AttributeBaseClass.name}:${this.usage}:${this.data.toString('hex')}`;

    public serializeJSON(_context: SerializeJSONContext): AttributeJSON {
      throw new Error('Not Implemented');
    }
  }

  return AttributeBaseClass;
}
