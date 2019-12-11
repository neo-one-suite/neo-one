import { common, ContractManifestJSON, IOHelper, UInt160 } from '@neo-one/client-common';
import {
  assertContractPropertyState,
  ContractManifestModel,
  ContractManifestModelAdd,
} from '@neo-one/client-full-common';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../Serializable';
import { BinaryReader, utils } from '../utils';
import { ContractABI } from './abi';
import { ContractGroup, ContractPermissions } from './permissions';

export interface ContractManifestAdd extends ContractManifestModelAdd {}

export class ContractManifest extends ContractManifestModel implements SerializableJSON<ContractManifestJSON> {
  public get size(): number {
    return this.contractManifestSizeInternal();
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractManifest {
    return deserializeContractManifestWireBase({
      context: options.context,
      reader: options.reader,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractManifest {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly groupsDeserializable: readonly ContractGroup[];
  public readonly abiDeserializable: ContractABI;
  public readonly permissionsDeserializable: readonly ContractPermissions[];

  private readonly contractManifestSizeInternal = utils.lazy(() =>
    sizeOfContractManifest({
      abi: this.abiDeserializable,
      groups: this.groupsDeserializable,
      permissions: this.permissionsDeserializable,
      trusts: this.trusts,
      safeMethods: this.safeMethods,
    }),
  );

  public constructor({ groups, features, abi, permissions, trusts, safeMethods }: ContractManifestAdd) {
    super({ groups, features, abi, permissions, trusts, safeMethods });
    this.groupsDeserializable = groups.map(
      (group) => new ContractGroup({ publicKey: group.publicKey, signature: group.signature }),
    );
    this.abiDeserializable = new ContractABI({
      hash: abi.hash,
      entryPoint: abi.entryPoint,
      methods: abi.methods,
      events: abi.events,
    });
    this.permissionsDeserializable = permissions.map(
      (permission) => new ContractPermissions({ contract: permission.contract, methods: permission.methods }),
    );
  }

  public serializeJSON(context: SerializeJSONContext): ContractManifestJSON {
    return {
      abi: this.abiDeserializable.serializeJSON(context),
      groups: this.groupsDeserializable.map((group) => group.serializeJSON(context)),
      permissions: this.permissionsDeserializable.map((permission) => permission.serializeJSON(context)),
      trusts: this.trusts.map(common.uInt160ToString),
      safeMethods: this.safeMethods,
      features: {
        storage: this.hasStorage,
        payable: this.payable,
      },
    };
  }
}

export const sizeOfContractManifest = ({
  groups,
  abi,
  permissions,
  trusts,
  safeMethods,
}: {
  readonly groups: readonly ContractGroup[];
  readonly abi: ContractABI;
  readonly permissions: readonly ContractPermissions[];
  readonly trusts: readonly UInt160[];
  readonly safeMethods: readonly string[];
}) =>
  abi.size +
  IOHelper.sizeOfArray(groups, (group) => group.size) +
  IOHelper.sizeOfArray(permissions, (permission) => permission.size) +
  IOHelper.sizeOfArray(trusts, (_trust) => IOHelper.sizeOfUInt160) +
  IOHelper.sizeOfArray(safeMethods, (method) => IOHelper.sizeOfVarString(method)) +
  // features
  IOHelper.sizeOfUInt8;

export const deserializeContractManifestWireBase = ({
  reader,
  context,
}: DeserializeWireBaseOptions): ContractManifest => {
  const abi = ContractABI.deserializeWireBase({ reader, context });
  const groups = reader.readArray(() => ContractGroup.deserializeWireBase({ reader, context }));
  const permissions = reader.readArray(() => ContractPermissions.deserializeWireBase({ reader, context }));
  const trusts = reader.readArray(() => reader.readUInt160());
  const safeMethods = reader.readArray(() => reader.readVarString());
  const features = assertContractPropertyState(reader.readUInt8());

  return new ContractManifest({
    groups,
    features,
    abi,
    permissions,
    trusts,
    safeMethods,
  });
};
