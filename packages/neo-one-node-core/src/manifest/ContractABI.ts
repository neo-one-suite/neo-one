import { ContractABIJSON, InvalidFormatError, utils } from '@neo-one/client-common';
import { ContractABIModel } from '@neo-one/client-full-common';
import _ from 'lodash';
import { assertArrayStackItem, assertStructStackItem, StackItem } from '../StackItems';
import { ContractEventDescriptor } from './ContractEventDescriptor';
import { ContractMethodDescriptor } from './ContractMethodDescriptor';

export class ContractABI extends ContractABIModel<ContractMethodDescriptor, ContractEventDescriptor> {
  public static fromStackItem(stackItem: StackItem): ContractABI {
    const { array } = assertStructStackItem(stackItem);
    const methods = assertArrayStackItem(array[0]).array.map((method) =>
      ContractMethodDescriptor.fromStackItem(method),
    );
    const events = assertArrayStackItem(array[1]).array.map((event) => ContractEventDescriptor.fromStackItem(event));

    return new ContractABI({
      methods,
      events,
    });
  }

  public static deserializeJSON(json: ContractABIJSON): ContractABI {
    const methods = json.methods.map((method) => ContractMethodDescriptor.deserializeJSON(method));
    const events = json.events.map((event) => ContractEventDescriptor.deserializeJSON(event));

    if (methods.length === 0) {
      throw new InvalidFormatError('ABI must have more than 0 methods');
    }

    return new this({
      methods,
      events,
    });
  }

  private readonly dictionaryInternal = utils.lazy(() =>
    _.fromPairs(this.methods.map((method) => [method.name, method])),
  );

  public getMethod(name: string, pcount: number) {
    if (pcount < -1 || pcount > utils.USHORT_MAX_NUMBER) {
      throw new InvalidFormatError(`pcount of ${pcount} is out of range`);
    }

    try {
      if (pcount >= 0) {
        return this.dictionaryInternal()[name];
      }

      return this.methods.find((method) => method.name === name) ?? this.methods[0];
    } catch {
      return undefined;
    }
  }
}
