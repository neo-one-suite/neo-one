import { BinaryWriter, IOHelper, JSONHelper, MinimumDeploymentFeePolicyChangeJSON } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface MinimumDeploymentFeePolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: BN;
}

export class MinimumDeploymentFeePolicyChange
  extends PolicyChangeBase<PolicyChangeType.MinimumDeploymentFee>
  implements SerializableJSON<MinimumDeploymentFeePolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): MinimumDeploymentFeePolicyChange {
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

  public constructor({ value, index }: MinimumDeploymentFeePolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.MinimumDeploymentFee as PolicyChangeType.MinimumDeploymentFee,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeInt64LE(this.value);
  }

  public serializeJSON(): MinimumDeploymentFeePolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'MinimumDeploymentFee',
      value: JSONHelper.writeUInt64(this.value),
    };
  }
}
