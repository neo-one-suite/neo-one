import { ContractEventDescriptorJSON, SerializableJSON } from '@neo-one/client-common';
import { ContractParameterDefinitionModel } from './ContractParameterDefinitionModel';

export interface ContractEventDescriptorModelAdd<
  TContractParameterDefinition extends ContractParameterDefinitionModel = ContractParameterDefinitionModel,
> {
  readonly name: string;
  readonly parameters: readonly TContractParameterDefinition[];
}

export class ContractEventDescriptorModel<
  TContractParameterDefinition extends ContractParameterDefinitionModel = ContractParameterDefinitionModel,
> implements SerializableJSON<ContractEventDescriptorJSON>
{
  public readonly name: string;
  public readonly parameters: readonly TContractParameterDefinition[];

  public constructor({ name, parameters }: ContractEventDescriptorModelAdd<TContractParameterDefinition>) {
    this.name = name;
    this.parameters = parameters;
  }

  public serializeJSON(): ContractEventDescriptorJSON {
    return {
      name: this.name,
      parameters: this.parameters.map((param) => param.serializeJSON()),
    };
  }
}
