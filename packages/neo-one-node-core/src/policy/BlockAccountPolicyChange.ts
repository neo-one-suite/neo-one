import { BinaryWriter, BlockAccountPolicyChangeJSON, IOHelper, JSONHelper, UInt160 } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON } from '../Serializable';
import { utils } from '../utils';
import { PolicyChangeBase, PolicyChangeBaseAdd } from './PolicyChangeBase';
import { PolicyChangeType, toPolicyChangeTypeJSON } from './PolicyChangeType';

export interface BlockAccountPolicyChangeAdd extends PolicyChangeBaseAdd {
  readonly value: UInt160;
}

export class BlockAccountPolicyChange
  extends PolicyChangeBase<PolicyChangeType.BlockAccount>
  implements SerializableJSON<BlockAccountPolicyChangeJSON>
{
  public static deserializeWireBase(options: DeserializeWireBaseOptions): BlockAccountPolicyChange {
    const { reader } = options;
    const { index } = super.deserializePolicyChangeBaseWireBase(options);
    const value = reader.readUInt160();

    return new this({
      value,
      index,
    });
  }

  public readonly value: UInt160;
  public readonly sizeExclusive: () => number = utils.lazy(() => IOHelper.sizeOfUInt160);

  public constructor({ value, index }: BlockAccountPolicyChangeAdd) {
    super({
      // tslint:disable-next-line no-useless-cast
      type: PolicyChangeType.BlockAccount as PolicyChangeType.BlockAccount,
      index,
    });

    this.value = value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt160(this.value);
  }

  public serializeJSON(): BlockAccountPolicyChangeJSON {
    return {
      ...super.serializeJSON(),
      type: toPolicyChangeTypeJSON(this.type) as 'BlockAccount',
      value: JSONHelper.writeUInt160(this.value),
    };
  }
}
