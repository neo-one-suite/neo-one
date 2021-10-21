import { BinaryWriter, FeePerBytePolicyChangeJSON, IOHelper, JSONHelper } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface FeePerBytePolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: BN;
}

export class FeePerBytePolicyChange
  extends PolicyChangeBase<PolicyChangeType.FeePerByte>
  implements SerializableJSON<FeePerBytePolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): FeePerBytePolicyChange {
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

  public constructor({ value, index }: FeePerBytePolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.FeePerByte as PolicyChangeType.FeePerByte,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeInt64LE(this.value);
  }

  public serializeJSON(): FeePerBytePolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'FeePerByte',
      value: JSONHelper.writeUInt64(this.value),
    };
  }
}
