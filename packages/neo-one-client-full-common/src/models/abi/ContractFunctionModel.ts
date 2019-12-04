import {
  BinaryWriter,
  ContractParameterTypeModel,
  createSerializeWire,
  SerializableWire,
  SerializeWire,
} from '@neo-one/client-common';
import { ContractEventModel, ContractEventModelAdd, serializeContractEventWireBase } from './ContractEventModel';

export interface ContractFunctionModelAdd extends ContractEventModelAdd {
  readonly returnType: ContractParameterTypeModel;
}

export class ContractFunctionModel extends ContractEventModel implements SerializableWire<ContractFunctionModel> {
  public readonly returnType: ContractParameterTypeModel;
  public readonly serializeWire: SerializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  public constructor({ name, parameters, returnType }: ContractFunctionModelAdd) {
    super({ name, parameters });
    this.returnType = returnType;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    serializeContractFunctionWireBase({ writer, method: this });
  }
}

export const serializeContractFunctionWireBase = ({
  writer,
  method,
}: {
  readonly writer: BinaryWriter;
  readonly method: ContractFunctionModel;
}): void => {
  serializeContractEventWireBase({
    writer,
    event: new ContractEventModel({ name: method.name, parameters: method.parameters }),
  });
  writer.writeVarBytesLE(Buffer.from([method.returnType]));
};
