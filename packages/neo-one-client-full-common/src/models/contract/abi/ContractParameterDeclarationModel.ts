import {
  BinaryWriter,
  ContractParameterTypeModel,
  createSerializeWire,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';
import { BaseState } from '../../BaseState';

export interface ContractParameterDeclarationModelAdd {
  readonly type: ContractParameterTypeModel;
  readonly name: string;
}

export class ContractParameterDeclarationModel extends BaseState
  implements SerializableWire<ContractParameterDeclarationModel> {
  public readonly type: ContractParameterTypeModel;
  public readonly name: string;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ type, name }: ContractParameterDeclarationModelAdd) {
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
  readonly parameter: ContractParameterDeclarationModel;
}): void => {
  writer.writeUInt8(parameter.type);
  writer.writeVarString(parameter.name);
};
