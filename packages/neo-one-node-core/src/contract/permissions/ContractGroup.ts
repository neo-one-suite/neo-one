import { common, ContractGroupJSON, IOHelper } from '@neo-one/client-common';
import { ContractGroupModel, ContractGroupModelAdd } from '@neo-one/client-full-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../../Serializable';
import { BinaryReader, utils } from '../../utils';

export type ContractGroupAdd = ContractGroupModelAdd;

export class ContractGroup extends ContractGroupModel implements SerializableJSON<ContractGroupJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): ContractGroup {
    const publicKey = reader.readECPoint();
    const signature = reader.readVarString();

    return new this({
      publicKey,
      signature,
    });
  }

  public static fromJSON(groupJSON: ContractGroupJSON): ContractGroup {
    const { publicKey, signature } = groupJSON;

    return new ContractGroup({
      publicKey: common.stringToECPoint(publicKey),
      signature,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractGroup {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfECPoint(this.publicKey) + IOHelper.sizeOfVarString(this.signature),
  );

  public get size(): number {
    return this.sizeInternal();
  }

  public clone(): ContractGroup {
    return new ContractGroup({
      publicKey: this.publicKey,
      signature: this.signature,
    });
  }

  public serializeJSON(): ContractGroupJSON {
    return {
      publicKey: common.ecPointToString(this.publicKey),
      signature: this.signature,
    };
  }
}
