import { ContractEventDescriptorJSON, InvalidFormatError } from '@neo-one/client-common';
import { ContractEventDescriptorModel } from '@neo-one/client-full-common';
import { assertArrayStackItem, assertStructStackItem, StackItem } from '../StackItems';
import { ContractParameterDefinition } from './ContractParameterDefinition';

export class ContractEventDescriptor extends ContractEventDescriptorModel<ContractParameterDefinition> {
  public static fromStackItem(stackItem: StackItem): ContractEventDescriptor {
    const { array } = assertStructStackItem(stackItem);
    const name = array[0].getString();
    const parameters = assertArrayStackItem(array[1]).array.map((param) =>
      ContractParameterDefinition.fromStackItem(param),
    );

    return new ContractEventDescriptor({
      name,
      parameters,
    });
  }

  public static deserializeJSON(json: ContractEventDescriptorJSON): ContractEventDescriptor {
    const name = json.name;
    const parameters = json.parameters.map((param) => ContractParameterDefinition.deserializeJSON(param));
    if (name === '') {
      throw new InvalidFormatError('Contract event name cannot be an empty string');
    }
    if (new Set(parameters.map((p) => p.name)).size !== parameters.length) {
      throw new InvalidFormatError('Contract event parameters cannot have the same name');
    }

    return new this({
      name,
      parameters,
    });
  }
}
