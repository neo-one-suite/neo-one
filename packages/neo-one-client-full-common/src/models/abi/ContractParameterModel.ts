import {
  BinaryWriter,
  ContractParameterTypeModel,
  createSerializeWire,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';
import { BaseState } from '../BaseState';

export interface ContractParameterModelAdd {
  readonly type: ContractParameterTypeModel;
  readonly name: string;
}

export class ContractParameterModel extends BaseState implements SerializableWire<ContractParameterModel> {
  public readonly type: ContractParameterTypeModel;
  public readonly name: string;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ type, name }: ContractParameterModelAdd) {
    super({ version: undefined });
    this.type = type;
    this.name = name;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractParameterWireBase({ writer, parameter: this });
  }
}

export const serializeContractParameterWireBase = ({
  writer,
  parameter,
}: {
  readonly writer: BinaryWriter;
  readonly parameter: ContractParameterModel;
}): void => {
  writer.writeVarBytesLE(Buffer.from([parameter.type]));
  writer.writeVarString(parameter.name);
};
