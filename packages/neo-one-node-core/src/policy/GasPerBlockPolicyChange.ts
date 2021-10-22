import { BinaryWriter, GasPerBlockPolicyChangeJSON, IOHelper, JSONHelper } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface GasPerBlockPolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: BN;
}

export class GasPerBlockPolicyChange
  extends PolicyChangeBase<PolicyChangeType.GasPerBlock>
  implements SerializableJSON<GasPerBlockPolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): GasPerBlockPolicyChange {
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

  public constructor({ value, index }: GasPerBlockPolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.GasPerBlock as PolicyChangeType.GasPerBlock,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeInt64LE(this.value);
  }

  public serializeJSON(): GasPerBlockPolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'GasPerBlock',
      value: JSONHelper.writeUInt64(this.value),
    };
  }
}
