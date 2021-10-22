import { BinaryWriter, IOHelper, JSONHelper, RegisterPricePolicyChangeJSON } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface RegisterPricePolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: BN;
}

export class RegisterPricePolicyChange
  extends PolicyChangeBase<PolicyChangeType.RegisterPrice>
  implements SerializableJSON<RegisterPricePolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): RegisterPricePolicyChange {
    const { reader } = options;
    const { index } = super.deserializePolicyChangeBaseWireBase(options);
    const value = reader.readInt64LE();

    return new this({
      value,
      index,
    });
  }

  public readonly value: BN;
  public readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt64LE);

  public constructor({ value, index }: RegisterPricePolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.RegisterPrice as PolicyChangeType.RegisterPrice,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeInt64LE(this.value);
  }

  public serializeJSON(): RegisterPricePolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'RegisterPrice',
      value: JSONHelper.writeUInt64(this.value),
    };
  }
}
