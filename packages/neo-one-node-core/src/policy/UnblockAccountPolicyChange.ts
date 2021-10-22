import { BinaryWriter, IOHelper, JSONHelper, UInt160, UnblockAccountPolicyChangeJSON } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface UnblockAccountPolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: UInt160;
}

export class UnblockAccountPolicyChange
  extends PolicyChangeBase<PolicyChangeType.UnblockAccount>
  implements SerializableJSON<UnblockAccountPolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): UnblockAccountPolicyChange {
    const { reader } = options;
    const { index } = super.deserializePolicyChangeBaseWireBase(options);
    const value = reader.readUInt160();

    return new this({
      value,
      index,
    });
  }

  public readonly value: UInt160;
  public readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt64LE);

  public constructor({ value, index }: UnblockAccountPolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.UnblockAccount as PolicyChangeType.UnblockAccount,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt160(this.value);
  }

  public serializeJSON(): UnblockAccountPolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'UnblockAccount',
      value: JSONHelper.writeUInt160(this.value),
    };
  }
}
