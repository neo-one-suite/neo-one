import { common, ContractEventJSON, IOHelper } from '@neo-one/client-common';
import { ContractEventModel, ContractEventModelAdd } from '@neo-one/client-full-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../../Serializable';
import { BinaryReader, utils } from '../../utils';
import { ContractParameterDeclaration } from './parameters';

export type ContractEventAdd = ContractEventModelAdd<ContractParameterDeclaration>;

export class ContractEvent extends ContractEventModel<ContractParameterDeclaration>
  implements SerializableJSON<ContractEventJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractEvent {
    const { reader } = options;
    const name = reader.readVarString(common.MAX_CONTRACT_STRING);
    const parameters = reader.readArray(() => ContractParameterDeclaration.deserializeWireBase(options));

    return new this({
      name,
      parameters,
    });
  }

  public static fromJSON(eventJSON: ContractEventJSON): ContractEvent {
    const { name, parameters } = eventJSON;

    return new ContractEvent({
      name,
      parameters: parameters.map((parameter) => ContractParameterDeclaration.fromJSON(parameter)),
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractEvent {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly sizeInternal = utils.lazy(
    () => IOHelper.sizeOfVarString(this.name) + IOHelper.sizeOfArray(this.parameters, (parameter) => parameter.size),
  );

  public get size(): number {
    return this.sizeInternal();
  }

  public clone(): ContractEvent {
    return new ContractEvent({
      name: this.name,
      parameters: this.parameters,
    });
  }

  public serializeJSON(): ContractEventJSON {
    return {
      name: this.name,
      parameters: this.parameters.map((parameter) => parameter.serializeJSON()),
    };
  }
}
