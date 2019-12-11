import { BinaryWriter, createSerializeWire, SerializableWire, SerializeWire } from '@neo-one/client-common';
import { BaseState } from '../../BaseState';
import { ContractParameterDeclarationModel } from './ContractParameterDeclarationModel';

export interface ContractEventModelAdd {
  readonly name: string;
  readonly parameters: readonly ContractParameterDeclarationModel[];
}

export class ContractEventModel extends BaseState implements SerializableWire<ContractEventModel> {
  public readonly name: string;
  public readonly parameters: readonly ContractParameterDeclarationModel[];
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ name, parameters }: ContractEventModelAdd) {
    super({ version: undefined });
    this.name = name;
    this.parameters = parameters;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractEventWireBase({ writer, event: this });
  }
}

export const serializeContractEventWireBase = ({
  writer,
  event,
}: {
  readonly writer: BinaryWriter;
  readonly event: ContractEventModel;
}): void => {
  writer.writeVarString(event.name);
  writer.writeArray(event.parameters, (parameter) => parameter.serializeWireBase(writer));
};
