import { BinaryWriter, IOHelper, StoragePricePolicyChangeJSON } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface StoragePricePolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: number;
}

export class StoragePricePolicyChange
  extends PolicyChangeBase<PolicyChangeType.StoragePrice>
  implements SerializableJSON<StoragePricePolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StoragePricePolicyChange {
    const { reader } = options;
    const { index } = super.deserializePolicyChangeBaseWireBase(options);
    const value = reader.readUInt32LE();

    return new this({
      value,
      index,
    });
  }

  public readonly value: number;
  public readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt64LE);

  public constructor({ value, index }: StoragePricePolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.StoragePrice as PolicyChangeType.StoragePrice,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt32LE(this.value);
  }

  public serializeJSON(): StoragePricePolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'StoragePrice',
      value: this.value,
    };
  }
}
