import {
  BinaryWriter,
  ContractParameterTypeModel,
  createSerializeWire,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';
import { ContractEventModel, ContractEventModelAdd } from './ContractEventModel';
import { ContractParameterDeclarationModel } from './ContractParameterDeclarationModel';

export interface ContractMethodDescriptorModelAdd<
  TContractParameterDeclaration extends ContractParameterDeclarationModel = ContractParameterDeclarationModel
> extends ContractEventModelAdd<TContractParameterDeclaration> {
  readonly returnType: ContractParameterTypeModel;
}

export class ContractMethodDescriptorModel<
  TContractParameterDeclaration extends ContractParameterDeclarationModel = ContractParameterDeclarationModel
> extends ContractEventModel<TContractParameterDeclaration> implements SerializableWire<ContractMethodDescriptorModel> {
  public readonly returnType: ContractParameterTypeModel;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor(options: ContractMethodDescriptorModelAdd<TContractParameterDeclaration>) {
    super(options);
    this.returnType = options.returnType;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarString(this.name);
    writer.writeArray(this.parameters, (parameter) => parameter.serializeWireBase(writer));
    writer.writeUInt8(this.returnType);
  }
}
