import {
  assertContractParameterType,
  common,
  ContractFunctionJSON,
  IOHelper,
  toJSONContractParameterType,
} from '@neo-one/client-common';
import { ContractFunctionModel } from '@neo-one/client-full-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../../Serializable';
import { BinaryReader, utils } from '../../utils';
import { ContractEventAdd } from './ContractEvent';
import { ContractParameterDeclaration, ContractParameterType } from './parameters';

export interface ContractFunctionAdd extends ContractEventAdd {
  readonly returnType: ContractParameterType;
}

// TODO: rename this to `ContractMethodDescriptor` to match NEO? not super important just semantic
export class ContractFunction extends ContractFunctionModel<ContractParameterDeclaration>
  implements SerializableJSON<ContractFunctionJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractFunction {
    const { reader } = options;
    const name = reader.readVarString(common.MAX_CONTRACT_STRING);
    const parameters = reader.readArray(() => ContractParameterDeclaration.deserializeWireBase(options));
    const returnType = assertContractParameterType(reader.readUInt8());

    return new this({
      name,
      parameters,
      returnType,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractFunction {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly sizeInternal = utils.lazy(
    () =>
      IOHelper.sizeOfVarString(this.name) +
      IOHelper.sizeOfArray(this.parameters, (parameter) => parameter.size) +
      IOHelper.sizeOfUInt8,
  );

  public get size(): number {
    return this.sizeInternal();
  }

  public clone(): ContractFunction {
    return new ContractFunction({
      name: this.name,
      parameters: this.parameters.map((parameter) => parameter.clone()),
      returnType: this.returnType,
    });
  }

  public serializeJSON(): ContractFunctionJSON {
    return {
      name: this.name,
      parameters: this.parameters.map((parameter) => parameter.serializeJSON()),
      returnType: toJSONContractParameterType(this.returnType),
    };
  }
}
