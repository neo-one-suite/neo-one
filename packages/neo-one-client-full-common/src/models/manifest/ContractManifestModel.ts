import {
  BinaryWriter,
  common,
  ContractManifestJSON,
  createSerializeWire,
  JSONHelper,
  SerializableJSON,
  SerializableWire,
  SerializeWire,
  UInt160,
  UInt160Hex,
  utils,
  WildcardContainer,
} from '@neo-one/client-common';
import { JSONObject } from '@neo-one/utils';
import { ContractABIModel } from './ContractABIModel';
import { ContractFeaturesModel, HasPayable, HasStorage } from './ContractFeaturesModel';
import { ContractGroupModel } from './ContractGroupModel';
import { ContractPermissionModel } from './ContractPermissionModel';

export interface ContractManifestModelAdd<
  TContractABI extends ContractABIModel = ContractABIModel,
  TContractGroup extends ContractGroupModel = ContractGroupModel,
  TContractPermission extends ContractPermissionModel = ContractPermissionModel
> {
  readonly groups: readonly TContractGroup[];
  readonly features: ContractFeaturesModel;
  readonly supportedStandards: readonly string[];
  readonly abi: TContractABI;
  readonly permissions: readonly TContractPermission[];
  readonly trusts: WildcardContainer<UInt160>;
  readonly safeMethods: WildcardContainer<string>;
  readonly extra?: JSONObject;
}

export class ContractManifestModel<
  TContractABI extends ContractABIModel = ContractABIModel,
  TContractGroup extends ContractGroupModel = ContractGroupModel,
  TContractPermission extends ContractPermissionModel = ContractPermissionModel
> implements SerializableWire, SerializableJSON<ContractManifestJSON> {
  public static readonly maxLength = common.MAX_MANIFEST_LENGTH;
  public readonly groups: readonly TContractGroup[];
  public readonly features: ContractFeaturesModel;
  public readonly supportedStandards: readonly string[];
  public readonly abi: TContractABI;
  public readonly permissions: readonly TContractPermission[];
  public readonly trusts: WildcardContainer<UInt160>;
  public readonly safeMethods: WildcardContainer<string>;
  public readonly extra: JSONObject | undefined;
  public readonly hasStorage: boolean;
  public readonly payable: boolean;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly hashInternal = utils.lazy(() => this.abi.hash);
  private readonly hashHexInternal = utils.lazy(() => common.uInt160ToHex(this.hash));

  public constructor({
    groups,
    features,
    supportedStandards,
    abi,
    permissions,
    trusts,
    safeMethods,
    extra,
  }: ContractManifestModelAdd<TContractABI, TContractGroup, TContractPermission>) {
    this.groups = groups;
    this.features = features;
    this.supportedStandards = supportedStandards;
    this.abi = abi;
    this.permissions = permissions;
    this.trusts = trusts;
    this.safeMethods = safeMethods;
    this.hasStorage = HasStorage.has(features);
    this.payable = HasPayable.has(features);
    this.extra = extra;
  }

  public get hash(): UInt160 {
    return this.hashInternal();
  }

  public get hashHex(): UInt160Hex {
    return this.hashHexInternal();
  }

  public serializeJSON(): ContractManifestJSON {
    return {
      // TODO: not sure if hash and hashHex should be returned here
      // we serialize hash but not hashHex in old `Contract.ts`
      hash: JSONHelper.writeUInt160(this.hash),
      hashHex: this.hashHex,
      groups: this.groups.map((group) => group.serializeJSON()),
      features: {
        storage: this.hasStorage,
        payable: this.payable,
      },
      supportedStandards: this.supportedStandards,
      abi: this.abi.serializeJSON(),
      permissions: this.permissions.map((permission) => permission.serializeJSON()),
      trusts: common.isWildcard(this.trusts) ? this.trusts : this.trusts.map((trust) => JSONHelper.writeUInt160(trust)),
      safeMethods: this.safeMethods,
      extra: this.extra,
    };
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarString(JSON.stringify(this.serializeJSON()));
  }
}
