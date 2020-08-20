import {
  ContractMethodDescriptorJSON,
  ContractParameterTypeModel,
  SerializableJSON,
  toJSONContractParameterType,
} from '@neo-one/client-common';
import { ContractEventDescriptorModel, ContractEventDescriptorModelAdd } from './ContractEventDescriptorModel';
import { ContractParameterDefinitionModel } from './ContractParameterDefinitionModel';

export interface ContractMethodDescriptorModelAdd<
  TContractParameterDefinition extends ContractParameterDefinitionModel = ContractParameterDefinitionModel
> extends ContractEventDescriptorModelAdd<TContractParameterDefinition> {
  readonly returnType: ContractParameterTypeModel;
  readonly offset?: number;
}

export class ContractMethodDescriptorModel<
  TContractParameterDefinition extends ContractParameterDefinitionModel = ContractParameterDefinitionModel
> extends ContractEventDescriptorModel<TContractParameterDefinition>
  implements SerializableJSON<ContractMethodDescriptorJSON> {
  public readonly returnType: ContractParameterTypeModel;
  private readonly offset?: number;

  public constructor(options: ContractMethodDescriptorModelAdd<TContractParameterDefinition>) {
    super(options);
    this.returnType = options.returnType;
    this.offset = options.offset;
  }

  public serializeJSON(): ContractMethodDescriptorJSON {
    return {
      ...super.serializeJSON(),
      offset: this.offset,
      returnType: toJSONContractParameterType(this.returnType),
    };
  }
}
