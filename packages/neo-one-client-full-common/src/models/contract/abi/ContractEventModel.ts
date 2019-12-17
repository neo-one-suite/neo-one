import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { ContractParameterDeclarationModel } from './ContractParameterDeclarationModel';

export interface ContractEventModelAdd<
  TContractParameterDeclaration extends ContractParameterDeclarationModel = ContractParameterDeclarationModel
> {
  readonly name: string;
  readonly parameters: readonly TContractParameterDeclaration[];
}

export class ContractEventModel<
  TContractParameterDeclaration extends ContractParameterDeclarationModel = ContractParameterDeclarationModel
> implements SerializableWire<ContractEventModel> {
  public readonly name: string;
  public readonly parameters: readonly TContractParameterDeclaration[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ name, parameters }: ContractEventModelAdd<TContractParameterDeclaration>) {
    this.name = name;
    this.parameters = parameters;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeVarString(this.name);
    writer.writeArray(this.parameters, (parameter) => parameter.serializeWireBase(writer));
  }
}
