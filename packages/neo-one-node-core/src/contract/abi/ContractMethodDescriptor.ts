import {
  assertContractParameterType,
  common,
  ContractMethodDescriptorJSON,
  IOHelper,
  toJSONContractParameterType,
} from '@neo-one/client-common';
import { ContractMethodDescriptorModel } from '@neo-one/client-full-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../../Serializable';
import { BinaryReader, utils } from '../../utils';
import { ContractEventAdd } from './ContractEvent';
import { ContractParameterDeclaration, ContractParameterType } from './parameters';

export interface ContractMethodDescriptorAdd extends ContractEventAdd {
  readonly returnType: ContractParameterType;
}

export class ContractMethodDescriptor extends ContractMethodDescriptorModel<ContractParameterDeclaration>
  implements SerializableJSON<ContractMethodDescriptorJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractMethodDescriptor {
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

  public static deserializeWire(options: DeserializeWireOptions): ContractMethodDescriptor {
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

  public clone(): ContractMethodDescriptor {
    return new ContractMethodDescriptor({
      name: this.name,
      parameters: this.parameters.map((parameter) => parameter.clone()),
      returnType: this.returnType,
    });
  }

  public serializeJSON(): ContractMethodDescriptorJSON {
    return {
      name: this.name,
      parameters: this.parameters.map((parameter) => parameter.serializeJSON()),
      returnType: toJSONContractParameterType(this.returnType),
    };
  }
}
