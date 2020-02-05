import { common, ContractManifestJSON, IOHelper } from '@neo-one/client-common';
import {
  assertContractPropertyState,
  ContractManifestModel,
  ContractManifestModelAdd,
  getContractProperties,
} from '@neo-one/client-full-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../Serializable';
import { BinaryReader, utils } from '../utils';
import { ContractABI } from './abi';
import { ContractGroup, ContractPermissions } from './permissions';

export type ContractManifestAdd = ContractManifestModelAdd<ContractABI, ContractGroup, ContractPermissions>;

export class ContractManifest extends ContractManifestModel<ContractABI, ContractGroup, ContractPermissions>
  implements SerializableJSON<ContractManifestJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractManifest {
    const { reader } = options;
    const abi = ContractABI.deserializeWireBase(options);
    const groups = reader.readArray(() => ContractGroup.deserializeWireBase(options));
    const permissions = reader.readArray(() => ContractPermissions.deserializeWireBase(options));
    const trusts = reader.readArray(reader.readUInt160);
    const safeMethods = reader.readArray(reader.readVarString);
    const features = assertContractPropertyState(reader.readUInt8());

    return new this({
      abi,
      groups,
      permissions,
      trusts,
      safeMethods,
      features,
    });
  }

  public static fromJSON(manifestJSON: ContractManifestJSON): ContractManifest {
    const { abi, groups, permissions, trusts, safeMethods, features } = manifestJSON;

    return new ContractManifest({
      abi: ContractABI.fromJSON(abi),
      groups: groups.map((group) => ContractGroup.fromJSON(group)),
      permissions: permissions.map((permission) => ContractPermissions.fromJSON(permission)),
      trusts: trusts.map((trust) => common.stringToUInt160(trust)),
      safeMethods,
      features: getContractProperties({ hasStorage: features.storage, payable: features.payable }),
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractManifest {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly sizeInternal = utils.lazy(
    () =>
      this.abi.size +
      IOHelper.sizeOfArray(this.groups, (group) => group.size) +
      IOHelper.sizeOfArray(this.permissions, (permission) => permission.size) +
      IOHelper.sizeOfArray(this.trusts, (_trust) => IOHelper.sizeOfUInt160) +
      IOHelper.sizeOfArray(this.safeMethods, (method) => IOHelper.sizeOfVarString(method)) +
      // features
      IOHelper.sizeOfUInt8,
  );

  public get size() {
    return this.sizeInternal();
  }

  public clone(): ContractManifest {
    return new ContractManifest({
      abi: this.abi.clone(),
      groups: this.groups.map((group) => group.clone()),
      features: this.features,
      permissions: this.permissions.map((permission) => permission.clone()),
      trusts: this.trusts,
      safeMethods: this.safeMethods,
      // TODO: when narrowing the type on ContractManifestModel make sure it has a `.clone()` method.
      extra: this.extra !== undefined ? this.extra.clone() : undefined,
    });
  }

  public serializeJSON(): ContractManifestJSON {
    return {
      abi: this.abi.serializeJSON(),
      groups: this.groups.map((group) => group.serializeJSON()),
      permissions: this.permissions.map((permission) => permission.serializeJSON()),
      trusts: this.trusts.map(common.uInt160ToString),
      safeMethods: this.safeMethods,
      features: {
        storage: this.hasStorage,
        payable: this.payable,
      },
    };
  }
}
