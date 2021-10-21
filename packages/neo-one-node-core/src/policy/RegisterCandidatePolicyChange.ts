import { BinaryWriter, ECPoint, IOHelper, JSONHelper, RegisterCandidatePolicyChangeJSON } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface RegisterCandidatePolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: ECPoint;
}

export class RegisterCandidatePolicyChange
  extends PolicyChangeBase<PolicyChangeType.RegisterCandidate>
  implements SerializableJSON<RegisterCandidatePolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): RegisterCandidatePolicyChange {
    const { reader } = options;
    const { index } = super.deserializePolicyChangeBaseWireBase(options);
    const value = reader.readECPoint();

    return new this({
      value,
      index,
    });
  }

  public readonly value: ECPoint;
  public readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt64LE);

  public constructor({ value, index }: RegisterCandidatePolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.RegisterCandidate as PolicyChangeType.RegisterCandidate,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeECPoint(this.value);
  }

  public serializeJSON(): RegisterCandidatePolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'RegisterCandidate',
      value: JSONHelper.writeECPoint(this.value),
    };
  }
}
