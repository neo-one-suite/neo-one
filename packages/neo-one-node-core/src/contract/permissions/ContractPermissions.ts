import { ContractPermissionsJSON, IOHelper } from '@neo-one/client-common';
import { ContractPermissionsModel, ContractPermissionsModelAdd } from '@neo-one/client-full-common';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../../Serializable';
import { BinaryReader, utils } from '../../utils';
import { ContractPermissionDescriptor } from './ContractPermissionDescriptor';

export interface ContractPermissionsAdd extends ContractPermissionsModelAdd {}

export class ContractPermissions extends ContractPermissionsModel implements SerializableJSON<ContractPermissionsJSON> {
  public get size(): number {
    return this.contractPermissionsSizeInternal();
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractPermissions {
    return deserializeContractPermissionsWireBase({
      context: options.context,
      reader: options.reader,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractPermissions {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly contractDeserializable: ContractPermissionDescriptor;

  private readonly contractPermissionsSizeInternal = utils.lazy(() =>
    sizeOfContractPermissions({
      contract: this.contractDeserializable,
      methods: this.methods,
    }),
  );

  public constructor({ contract, methods }: ContractPermissionsAdd) {
    super({ contract, methods });
    this.contractDeserializable = new ContractPermissionDescriptor({ hashOrGroup: contract.hashOrGroup });
  }

  public serializeJSON(context: SerializeJSONContext): ContractPermissionsJSON {
    return {
      contract: this.contractDeserializable.serializeJSON(context),
      methods: this.methods,
    };
  }
}

export const sizeOfContractPermissions = ({
  contract,
  methods,
}: {
  readonly contract: ContractPermissionDescriptor;
  readonly methods: readonly string[];
}) => contract.size + IOHelper.sizeOfArray(methods, (method) => IOHelper.sizeOfVarString(method));

export const deserializeContractPermissionsWireBase = ({
  reader,
  context,
}: DeserializeWireBaseOptions): ContractPermissions => {
  const contract = ContractPermissionDescriptor.deserializeWireBase({ reader, context });
  const methods = reader.readArray(() => reader.readVarString());

  return new ContractPermissions({
    contract,
    methods,
  });
};
