import { ContractEventDescriptorJSON } from '@neo-one/client-common';
import { ContractEventDescriptorModel } from '@neo-one/client-full-common';
import { ContractParameterDefinition } from './ContractParameterDefinition';

export class ContractEventDescriptor extends ContractEventDescriptorModel<ContractParameterDefinition> {
  public static deserializeJSON(json: ContractEventDescriptorJSON): ContractEventDescriptor {
    const name = json.name;
    const parameters = json.parameters.map((param) => ContractParameterDefinition.deserializeJSON(param));

    return new this({
      name,
      parameters,
    });
  }
}
