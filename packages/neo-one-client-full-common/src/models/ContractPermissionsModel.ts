import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { BaseState } from './BaseState';
import { ContractPermissionDescriptorModel } from './ContractPermissionDescriptorModel';

export interface ContractPermissionsModelAdd {
  readonly contract: ContractPermissionDescriptorModel;
  readonly methods: readonly string[];
}

export class ContractPermissionsModel extends BaseState implements SerializableWire<ContractPermissionsModel> {
  public readonly contract: ContractPermissionDescriptorModel;
  public readonly methods: readonly string[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ contract, methods }: ContractPermissionsModelAdd) {
    super({ version: undefined });
    this.contract = contract;
    this.methods = methods;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractPermissionsWireBase({ writer, permissions: this });
  }
}

export const serializeContractPermissionsWireBase = ({
  writer,
  permissions,
}: {
  readonly writer: BinaryWriter;
  readonly permissions: ContractPermissionsModel;
}): void => {
  permissions.contract.serializeWireBase(writer);
  permissions.methods.forEach((str) => writer.writeVarString(str));
};
