import {
  BinaryWriter,
  common,
  createSerializeWire,
  SerializableWire,
  SerializeWire,
  UInt160,
  UInt160Hex,
  utils,
} from '@neo-one/client-common';
import { ContractABIModel } from './abi';
import {
  ContractGroupModel,
  ContractPermissionsModel,
  ContractPropertyStateModel,
  HasPayable,
  HasStorage,
} from './permissions';

export interface ContractManifestModelAdd<
  TContractABI extends ContractABIModel = ContractABIModel,
  TContractGroup extends ContractGroupModel = ContractGroupModel,
  TContractPermissions extends ContractPermissionsModel = ContractPermissionsModel,
  // TODO: narrow this type
  // tslint:disable-next-line: no-any
  Extra = any
> {
  readonly groups: readonly TContractGroup[];
  readonly features: ContractPropertyStateModel;
  readonly abi: TContractABI;
  readonly permissions: readonly TContractPermissions[];
  readonly trusts: readonly UInt160[];
  readonly safeMethods: readonly string[];
  readonly extra?: Extra;
}

export class ContractManifestModel<
  TContractABI extends ContractABIModel = ContractABIModel,
  TContractGroup extends ContractGroupModel = ContractGroupModel,
  TContractPermissions extends ContractPermissionsModel = ContractPermissionsModel,
  // TODO: narrow this type
  // tslint:disable-next-line: no-any
  Extra = any
> implements SerializableWire<ContractManifestModel> {
  public get hash(): UInt160 {
    return this.hashInternal();
  }

  public get hashHex(): UInt160Hex {
    return this.hashHexInternal();
  }
  public readonly maxLength = 2048;
  public readonly abi: TContractABI;
  public readonly groups: readonly TContractGroup[];
  public readonly permissions: readonly TContractPermissions[];
  public readonly trusts: readonly UInt160[];
  public readonly safeMethods: readonly string[];
  public readonly hasStorage: boolean;
  public readonly payable: boolean;
  public readonly features: ContractPropertyStateModel;
  public readonly extra: Extra | undefined;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));
  private readonly hashInternal = utils.lazy(() => this.abi.hash);
  private readonly hashHexInternal = utils.lazy(() => common.uInt160ToHex(this.hash));

  public constructor({
    abi,
    groups,
    features,
    permissions,
    trusts,
    safeMethods,
    extra,
  }: ContractManifestModelAdd<TContractABI, TContractGroup, TContractPermissions>) {
    this.abi = abi;
    this.groups = groups;
    this.permissions = permissions;
    this.trusts = trusts;
    this.safeMethods = safeMethods;
    this.features = features;
    this.hasStorage = HasStorage.has(features);
    this.payable = HasPayable.has(features);
    this.extra = extra !== undefined ? extra : undefined;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractManifestWireBase({ writer, manifest: this });
  }
}

export const serializeContractManifestWireBase = ({
  writer,
  manifest,
}: {
  readonly writer: BinaryWriter;
  readonly manifest: ContractManifestModel;
}): void => {
  manifest.abi.serializeWireBase(writer);
  writer.writeArray(manifest.groups, (group) => group.serializeWireBase(writer));
  writer.writeArray(manifest.permissions, (permission) => permission.serializeWireBase(writer));
  writer.writeArray(manifest.trusts, (trust) => writer.writeUInt160(trust));
  writer.writeArray(manifest.safeMethods, (method) => writer.writeVarString(method));
  writer.writeUInt8(manifest.features);
};
