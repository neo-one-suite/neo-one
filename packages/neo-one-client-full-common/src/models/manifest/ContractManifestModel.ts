import {
  BinaryWriter,
  common,
  ContractManifestJSON,
  createSerializeWire,
  SerializableJSON,
  SerializableWire,
  SerializeWire,
  WildcardContainer,
} from '@neo-one/client-common';
import { JSONObject } from '@neo-one/utils';
import { ContractABIModel } from './ContractABIModel';
import { ContractGroupModel } from './ContractGroupModel';
import { ContractPermissionDescriptorModel } from './ContractPermissionDescriptorModel';
import { ContractPermissionModel } from './ContractPermissionModel';

export interface ContractManifestModelAdd<
  TContractABI extends ContractABIModel = ContractABIModel,
  TContractGroup extends ContractGroupModel = ContractGroupModel,
  TContractPermission extends ContractPermissionModel = ContractPermissionModel,
> {
  readonly name: string;
  readonly groups: readonly TContractGroup[];
  readonly supportedStandards: readonly string[];
  readonly abi: TContractABI;
  readonly permissions: readonly TContractPermission[];
  readonly trusts: WildcardContainer<ContractPermissionDescriptorModel>;
  readonly extra?: JSONObject;
}

export class ContractManifestModel<
  TContractABI extends ContractABIModel = ContractABIModel,
  TContractGroup extends ContractGroupModel = ContractGroupModel,
  TContractPermission extends ContractPermissionModel = ContractPermissionModel,
> implements SerializableWire, SerializableJSON<ContractManifestJSON>
{
  public static readonly maxLength = common.MAX_MANIFEST_LENGTH;
  public readonly name: string;
  public readonly groups: readonly TContractGroup[];
  public readonly supportedStandards: readonly string[];
  public readonly abi: TContractABI;
  public readonly permissions: readonly TContractPermission[];
  public readonly trusts: WildcardContainer<ContractPermissionDescriptorModel>;
  public readonly extra: JSONObject | undefined;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  // There seems to be a bug in the C# implementation where there is no variable in front. See open GH issue
  public readonly serializeWireForNeo: SerializeWire = createSerializeWire(this.serializeWireBaseForNeo.bind(this));

  public constructor({
    name,
    groups,
    supportedStandards,
    abi,
    permissions,
    trusts,
    extra,
  }: ContractManifestModelAdd<TContractABI, TContractGroup, TContractPermission>) {
    this.name = name;
    this.groups = groups;
    this.supportedStandards = supportedStandards;
    this.abi = abi;
    this.permissions = permissions;
    this.trusts = trusts;
    this.extra = extra;
  }

  public serializeJSON(): ContractManifestJSON {
    return {
      name: this.name,
      groups: this.groups.map((group) => group.serializeJSON()),
      supportedstandards: this.supportedStandards,
      abi: this.abi.serializeJSON(),
      permissions: this.permissions.map((permission) => permission.serializeJSON()),
      trusts: common.isWildcard(this.trusts) ? this.trusts : this.trusts.map((trust) => trust.serializeJSON()),
      features: {},
      extra: this.extra,
    };
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarString(JSON.stringify(this.serializeJSON()));
  }

  public serializeWireBaseForNeo(writer: BinaryWriter): void {
    // There seems to be a bug in the C# implementation where there is no variable in front. See open GH issue
    writer.writeVarStringWithoutVar(JSON.stringify(this.serializeJSON()));
  }
}
