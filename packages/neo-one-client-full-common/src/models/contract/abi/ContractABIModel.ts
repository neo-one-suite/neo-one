import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire, UInt160 } from '@neo-one/client-common';
import { ContractEventModel } from './ContractEventModel';
import { ContractFunctionModel } from './ContractFunctionModel';

export interface ContractABIModelAdd<
  TContractFunction extends ContractFunctionModel = ContractFunctionModel,
  TContractEvent extends ContractEventModel = ContractEventModel
> {
  readonly hash: UInt160;
  readonly entryPoint: TContractFunction;
  readonly methods: readonly TContractFunction[];
  readonly events: readonly TContractEvent[];
}

export class ContractABIModel<
  TContractFunction extends ContractFunctionModel = ContractFunctionModel,
  TContractEvent extends ContractEventModel = ContractEventModel
> implements SerializableWire<ContractABIModel> {
  public readonly hash: UInt160;
  public readonly entryPoint: TContractFunction;
  public readonly methods: readonly TContractFunction[];
  public readonly events: readonly TContractEvent[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ hash, entryPoint, methods, events }: ContractABIModelAdd<TContractFunction, TContractEvent>) {
    this.hash = hash;
    this.entryPoint = entryPoint;
    this.methods = methods;
    this.events = events;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.hash);
    this.entryPoint.serializeWireBase(writer);
    writer.writeArray(this.methods, (method) => method.serializeWireBase(writer));
    writer.writeArray(this.events, (event) => event.serializeWireBase(writer));
  }
}
