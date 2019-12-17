import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { ContractPermissionDescriptorModel } from './ContractPermissionDescriptorModel';

export interface ContractPermissionsModelAdd<
  TContractPermissionDescriptor extends ContractPermissionDescriptorModel = ContractPermissionDescriptorModel
> {
  readonly contract: TContractPermissionDescriptor;
  readonly methods: readonly string[];
}

export class ContractPermissionsModel<
  TContractPermissionDescriptor extends ContractPermissionDescriptorModel = ContractPermissionDescriptorModel
> implements SerializableWire<ContractPermissionsModel> {
  public readonly contract: TContractPermissionDescriptor;
  public readonly methods: readonly string[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ contract, methods }: ContractPermissionsModelAdd<TContractPermissionDescriptor>) {
    this.contract = contract;
    this.methods = methods;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    this.contract.serializeWireBase(writer);
    writer.writeArray(this.methods, (method) => writer.writeVarString(method));
  }
}
