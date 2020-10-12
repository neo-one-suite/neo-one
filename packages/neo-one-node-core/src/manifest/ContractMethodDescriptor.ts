import { ContractMethodDescriptorJSON, toContractParameterType } from '@neo-one/client-common';
import { ContractMethodDescriptorModel } from '@neo-one/client-full-common';
import { ContractParameterDefinition } from './ContractParameterDefinition';

export class ContractMethodDescriptor extends ContractMethodDescriptorModel<ContractParameterDefinition> {
  public static deserializeJSON(json: ContractMethodDescriptorJSON): ContractMethodDescriptor {
    const name = json.name;
    const parameters = json.parameters.map((param) => ContractParameterDefinition.deserializeJSON(param));
    const offset = json.offset;
    const returnType = toContractParameterType(json.returntype);

    return new this({
      name,
      parameters,
      offset,
      returnType,
    });
  }
}
