import { ContractABIJSON, SerializableJSON } from '@neo-one/client-common';
import { ContractEventDescriptorModel } from './ContractEventDescriptorModel';
import { ContractMethodDescriptorModel } from './ContractMethodDescriptorModel';

export interface ContractABIModelAdd<
  TContractMethod extends ContractMethodDescriptorModel = ContractMethodDescriptorModel,
  TContractEvent extends ContractEventDescriptorModel = ContractEventDescriptorModel,
> {
  readonly methods: readonly TContractMethod[];
  readonly events: readonly TContractEvent[];
}

export class ContractABIModel<
  TContractMethod extends ContractMethodDescriptorModel = ContractMethodDescriptorModel,
  TContractEvent extends ContractEventDescriptorModel = ContractEventDescriptorModel,
> implements SerializableJSON<ContractABIJSON>
{
  public readonly methods: readonly TContractMethod[];
  public readonly events: readonly TContractEvent[];

  public constructor({ methods, events }: ContractABIModelAdd<TContractMethod, TContractEvent>) {
    this.methods = methods;
    this.events = events;
  }

  public serializeJSON(): ContractABIJSON {
    return {
      methods: this.methods.map((method) => method.serializeJSON()),
      events: this.events.map((event) => event.serializeJSON()),
    };
  }
}
