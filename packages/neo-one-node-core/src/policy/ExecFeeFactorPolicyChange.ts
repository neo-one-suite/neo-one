import { BinaryWriter, ExecFeeFactorPolicyChangeJSON, IOHelper } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface ExecFeeFactorPolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: number;
}

export class ExecFeeFactorPolicyChange
  extends PolicyChangeBase<PolicyChangeType.ExecFeeFactor>
  implements SerializableJSON<ExecFeeFactorPolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ExecFeeFactorPolicyChange {
    const { reader } = options;
    const { index } = super.deserializePolicyChangeBaseWireBase(options);
    const value = reader.readUInt32LE();

    return new this({
      value,
      index,
    });
  }

  public readonly value: number;
  public readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt32LE);

  public constructor({ value, index }: ExecFeeFactorPolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.ExecFeeFactor as PolicyChangeType.ExecFeeFactor,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt32LE(this.value);
  }

  public serializeJSON(): ExecFeeFactorPolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'ExecFeeFactor',
      value: this.value,
    };
  }
}
