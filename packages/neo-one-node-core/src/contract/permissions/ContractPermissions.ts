import { ContractPermissionsJSON, IOHelper } from '@neo-one/client-common';
import { ContractPermissionsModel, ContractPermissionsModelAdd } from '@neo-one/client-full-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../../Serializable';
import { BinaryReader, utils } from '../../utils';
import { ContractPermissionDescriptor } from './ContractPermissionDescriptor';

export type ContractPermissionsAdd = ContractPermissionsModelAdd<ContractPermissionDescriptor>;

export class ContractPermissions extends ContractPermissionsModel<ContractPermissionDescriptor>
  implements SerializableJSON<ContractPermissionsJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractPermissions {
    const { reader } = options;
    const contract = ContractPermissionDescriptor.deserializeWireBase(options);
    const methods = reader.readArray(() => reader.readVarString());

    return new this({
      contract,
      methods,
    });
  }

  public static fromJSON(permissionJSON: ContractPermissionsJSON): ContractPermissions {
    const { contract, methods } = permissionJSON;

    return new ContractPermissions({
      contract: ContractPermissionDescriptor.fromJSON(contract),
      methods,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractPermissions {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly sizeInternal = utils.lazy(
    () => this.contract.size + IOHelper.sizeOfArray(this.methods, (method) => IOHelper.sizeOfVarString(method)),
  );

  public get size(): number {
    return this.sizeInternal();
  }

  public clone(): ContractPermissions {
    return new ContractPermissions({
      contract: this.contract,
      methods: this.methods,
    });
  }

  public serializeJSON(): ContractPermissionsJSON {
    return {
      contract: this.contract.serializeJSON(),
      methods: this.methods,
    };
  }
}
