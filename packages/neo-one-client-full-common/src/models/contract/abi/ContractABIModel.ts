import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire, UInt160 } from '@neo-one/client-common';
import { BaseState } from '../../BaseState';
import { ContractEventModel } from './ContractEventModel';
import { ContractFunctionModel } from './ContractFunctionModel';

export interface ContractABIModelAdd {
  readonly hash: UInt160;
  readonly entryPoint: ContractFunctionModel;
  readonly methods: readonly ContractFunctionModel[];
  readonly events: readonly ContractEventModel[];
}

export class ContractABIModel extends BaseState implements SerializableWire<ContractABIModel> {
  public readonly hash: UInt160;
  public readonly entryPoint: ContractFunctionModel;
  public readonly methods: readonly ContractFunctionModel[];
  public readonly events: readonly ContractEventModel[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ hash, entryPoint, methods, events }: ContractABIModelAdd) {
    super({ version: undefined });
    this.hash = hash;
    this.entryPoint = entryPoint;
    this.methods = methods;
    this.events = events;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractABIWireBase({ writer, abi: this });
  }
}

export const serializeContractABIWireBase = ({
  writer,
  abi,
}: {
  readonly writer: BinaryWriter;
  readonly abi: ContractABIModel;
}): void => {
  writer.writeUInt160(abi.hash);
  abi.entryPoint.serializeWireBase(writer);
  writer.writeArray(abi.methods, (method) => method.serializeWireBase(writer));
  writer.writeArray(abi.events, (event) => event.serializeWireBase(writer));
};
