import { ContractParameterDefinitionJSON, InvalidFormatError, toContractParameterType } from '@neo-one/client-common';
import { ContractParameterDefinitionModel } from '@neo-one/client-full-common';
import { ContractParameterType } from '../contractParameter';
import { assertStructStackItem, StackItem } from '../StackItems';

export class ContractParameterDefinition extends ContractParameterDefinitionModel {
  public static fromStackItem(stackItem: StackItem): ContractParameterDefinition {
    const { array } = assertStructStackItem(stackItem);
    const name = array[0].getString();
    const type = array[1].getInteger().toNumber();

    return new ContractParameterDefinition({
      name,
      type,
    });
  }

  public static deserializeJSON(json: ContractParameterDefinitionJSON): ContractParameterDefinition {
    const name = json.name;
    const type = toContractParameterType(json.type);

    if (name === '') {
      throw new InvalidFormatError('Contract parameter name cannot be an empty string');
    }
    if (type === ContractParameterType.Void) {
      throw new InvalidFormatError('Contract parameter type cannot be void');
    }

    return new this({
      name,
      type,
    });
  }
}
