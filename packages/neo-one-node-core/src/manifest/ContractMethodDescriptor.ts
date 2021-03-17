import { ContractMethodDescriptorJSON, InvalidFormatError, toContractParameterType } from '@neo-one/client-common';
import { ContractMethodDescriptorModel } from '@neo-one/client-full-common';
import { assertArrayStackItem, assertStructStackItem, StackItem } from '../StackItems';
import { ContractParameterDefinition } from './ContractParameterDefinition';

export class ContractMethodDescriptor extends ContractMethodDescriptorModel<ContractParameterDefinition> {
  public static fromStackItem(stackItem: StackItem): ContractMethodDescriptor {
    const { array } = assertStructStackItem(stackItem);
    const name = array[0].getString();
    const parameters = assertArrayStackItem(array[1]).array.map((param) =>
      ContractParameterDefinition.fromStackItem(param),
    );
    const returnType = array[2].getInteger().toNumber();
    const offset = array[3].getInteger().toNumber();
    const safe = array[4].getBoolean();

    return new ContractMethodDescriptor({
      name,
      parameters,
      returnType,
      offset,
      safe,
    });
  }

  public static deserializeJSON(json: ContractMethodDescriptorJSON): ContractMethodDescriptor {
    const name = json.name;
    if (name === '') {
      throw new InvalidFormatError('Contract method name cannot be an empty string');
    }
    const parameters = json.parameters.map((param) => ContractParameterDefinition.deserializeJSON(param));
    if (new Set(parameters.map((param) => param.name)).size !== parameters.length) {
      throw new InvalidFormatError('Contract method cannot have two parameters of the same name');
    }
    const offset = json.offset;
    if (offset < 0) {
      throw new InvalidFormatError('Contract method offset cannot be less than 0');
    }
    const returnType = toContractParameterType(json.returntype);
    const safe = json.safe;

    return new this({
      name,
      parameters,
      offset,
      returnType,
      safe,
    });
  }
}
