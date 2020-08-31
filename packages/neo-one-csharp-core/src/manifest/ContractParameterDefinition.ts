import { ContractParameterDefinitionJSON, toContractParameterType } from '@neo-one/client-common';
import { ContractParameterDefinitionModel } from '@neo-one/client-full-common';

export class ContractParameterDefinition extends ContractParameterDefinitionModel {
  public static deserializeJSON(json: ContractParameterDefinitionJSON): ContractParameterDefinition {
    const name = json.name;
    const type = toContractParameterType(json.type);

    return new this({
      name,
      type,
    });
  }
}
