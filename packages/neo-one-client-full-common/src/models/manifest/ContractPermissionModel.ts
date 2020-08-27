import { ContractPermissionJSON, SerializableJSON, WildcardContainer } from '@neo-one/client-common';
import { ContractPermissionDescriptorModel } from './ContractPermissionDescriptorModel';

export interface ContractPermissionModelAdd<
  TContractPermissionDescriptor extends ContractPermissionDescriptorModel = ContractPermissionDescriptorModel
> {
  readonly contract: TContractPermissionDescriptor;
  readonly methods: WildcardContainer<string>;
}

export class ContractPermissionModel<
  TContractPermissionDescriptor extends ContractPermissionDescriptorModel = ContractPermissionDescriptorModel
> implements SerializableJSON<ContractPermissionJSON> {
  public readonly contract: TContractPermissionDescriptor;
  public readonly methods: WildcardContainer<string>;

  public constructor({ contract, methods }: ContractPermissionModelAdd<TContractPermissionDescriptor>) {
    this.contract = contract;
    this.methods = methods;
  }

  public serializeJSON(): ContractPermissionJSON {
    return {
      contract: this.contract.serializeJSON(),
      methods: this.methods,
    };
  }
}
