import { common, ContractABIJSON, SerializableJSON, UInt160 } from '@neo-one/client-common';
import { ContractEventDescriptorModel } from './ContractEventDescriptorModel';
import { ContractMethodDescriptorModel } from './ContractMethodDescriptorModel';

export interface ContractABIModelAdd<
  TContractMethod extends ContractMethodDescriptorModel = ContractMethodDescriptorModel,
  TContractEvent extends ContractEventDescriptorModel = ContractEventDescriptorModel
> {
  readonly hash: UInt160;
  readonly methods: readonly TContractMethod[];
  readonly events: readonly TContractEvent[];
}

export class ContractABIModel<
  TContractMethod extends ContractMethodDescriptorModel = ContractMethodDescriptorModel,
  TContractEvent extends ContractEventDescriptorModel = ContractEventDescriptorModel
> implements SerializableJSON<ContractABIJSON> {
  public readonly hash: UInt160;
  public readonly methods: readonly TContractMethod[];
  public readonly events: readonly TContractEvent[];

  public constructor({ hash, methods, events }: ContractABIModelAdd<TContractMethod, TContractEvent>) {
    this.hash = hash;
    this.methods = methods;
    this.events = events;
  }

  public serializeJSON(): ContractABIJSON {
    return {
      hash: common.uInt160ToString(this.hash),
      methods: this.methods.map((method) => method.serializeJSON()),
      events: this.events.map((event) => event.serializeJSON()),
    };
  }
}
