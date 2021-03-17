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
  readonly offset: number;
  readonly safe: boolean;
}

export class ContractMethodDescriptorModel<
    TContractParameterDefinition extends ContractParameterDefinitionModel = ContractParameterDefinitionModel
  >
  extends ContractEventDescriptorModel<TContractParameterDefinition>
  implements SerializableJSON<ContractMethodDescriptorJSON> {
  public readonly returnType: ContractParameterTypeModel;
  public readonly offset: number;
  public readonly safe: boolean;

  public constructor(options: ContractMethodDescriptorModelAdd<TContractParameterDefinition>) {
    super(options);
    this.returnType = options.returnType;
    this.offset = options.offset;
    this.safe = options.safe;
  }

  public serializeJSON(): ContractMethodDescriptorJSON {
    return {
      ...super.serializeJSON(),
      returntype: toJSONContractParameterType(this.returnType),
      offset: this.offset,
      safe: this.safe,
    };
  }
}
