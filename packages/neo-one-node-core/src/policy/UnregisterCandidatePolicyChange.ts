import {
  BinaryWriter,
  ECPoint,
  IOHelper,
  JSONHelper,
  UnregisterCandidatePolicyChangeJSON,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface UnregisterCandidatePolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: ECPoint;
}

export class UnregisterCandidatePolicyChange
  extends PolicyChangeBase<PolicyChangeType.UnregisterCandidate>
  implements SerializableJSON<UnregisterCandidatePolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): UnregisterCandidatePolicyChange {
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

  public constructor({ value, index }: UnregisterCandidatePolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.UnregisterCandidate as PolicyChangeType.UnregisterCandidate,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeECPoint(this.value);
  }

  public serializeJSON(): UnregisterCandidatePolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'UnregisterCandidate',
      value: JSONHelper.writeECPoint(this.value),
    };
  }
}
