import {
  BinaryWriter,
  ContractParameterTypeModel,
  createSerializeWire,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';

export interface ContractParameterDeclarationModelAdd {
  readonly type: ContractParameterTypeModel;
  readonly name: string;
}

export class ContractParameterDeclarationModel implements SerializableWire<ContractParameterDeclarationModel> {
  public readonly type: ContractParameterTypeModel;
  public readonly name: string;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ type, name }: ContractParameterDeclarationModelAdd) {
    this.type = type;
    this.name = name;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt8(this.type);
    writer.writeVarString(this.name);
  }
}
