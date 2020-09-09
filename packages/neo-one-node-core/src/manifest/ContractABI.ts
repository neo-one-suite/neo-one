import { ContractABIJSON, JSONHelper, utils } from '@neo-one/client-common';
import { ContractABIModel } from '@neo-one/client-full-common';
import _ from 'lodash';
import { ContractEventDescriptor } from './ContractEventDescriptor';
import { ContractMethodDescriptor } from './ContractMethodDescriptor';

export class ContractABI extends ContractABIModel<ContractMethodDescriptor, ContractEventDescriptor> {
  public static deserializeJSON(json: ContractABIJSON): ContractABI {
    const hash = JSONHelper.readUInt160(json.hash);
    const methods = json.methods.map((method) => ContractMethodDescriptor.deserializeJSON(method));
    const events = json.events.map((event) => ContractEventDescriptor.deserializeJSON(event));

    return new this({
      hash,
      methods,
      events,
    });
  }

  private readonly dictionaryInternal = utils.lazy(() =>
    _.fromPairs(this.methods.map((method) => [method.name, method])),
  );

  public getMethod(name: string) {
    try {
      return this.dictionaryInternal()[name];
    } catch {
      return undefined;
    }
  }
}
