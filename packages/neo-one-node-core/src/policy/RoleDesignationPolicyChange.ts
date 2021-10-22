import { BinaryWriter, IOHelper, RoleDesignationPolicyChangeJSON } from '@neo-one/client-common';
import { DesignationRole, toDesignationRoleJSON } from '../DesignationRole';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface RoleDesignationPolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: DesignationRole;
}

export class RoleDesignationPolicyChange
  extends PolicyChangeBase<PolicyChangeType.RoleDesignation>
  implements SerializableJSON<RoleDesignationPolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): RoleDesignationPolicyChange {
    const { reader } = options;
    const { index } = super.deserializePolicyChangeBaseWireBase(options);
    const value = reader.readUInt8();

    return new this({
      value,
      index,
    });
  }

  public readonly value: DesignationRole;
  public readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt64LE);

  public constructor({ value, index }: RoleDesignationPolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.RoleDesignation as PolicyChangeType.RoleDesignation,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt8(this.value);
  }

  public serializeJSON(): RoleDesignationPolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'RoleDesignation',
      value: toDesignationRoleJSON(this.value),
    };
  }
}
