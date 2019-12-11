import { ContractEventJSON, IOHelper } from '@neo-one/client-common';
import { ContractEventModel, ContractEventModelAdd } from '@neo-one/client-full-common';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../../Serializable';
import { BinaryReader, utils } from '../../utils';
import { ContractParameterDeclaration } from './parameters';

export interface ContractEventAdd extends ContractEventModelAdd {}

export class ContractEvent extends ContractEventModel implements SerializableJSON<ContractEventJSON> {
  public get size(): number {
    return this.contractEventSizeInternal();
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractEvent {
    return deserializeContractEventWireBase({
      context: options.context,
      reader: options.reader,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractEvent {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly parameterDeclarations: readonly ContractParameterDeclaration[];

  private readonly contractEventSizeInternal = utils.lazy(() =>
    sizeOfContractEvent({
      name: this.name,
      parameterDeclarations: this.parameterDeclarations,
    }),
  );

  public constructor({ name, parameters }: ContractEventAdd) {
    super({ name, parameters });
    this.parameterDeclarations = parameters.map(
      (parameter) => new ContractParameterDeclaration({ name: parameter.name, type: parameter.type }),
    );
  }

  public serializeJSON(context: SerializeJSONContext): ContractEventJSON {
    return {
      name: this.name,
      parameters: this.parameterDeclarations.map((parameter) => parameter.serializeJSON(context)),
    };
  }
}

export const sizeOfContractEvent = ({
  name,
  parameterDeclarations,
}: {
  readonly name: string;
  readonly parameterDeclarations: readonly ContractParameterDeclaration[];
}) => IOHelper.sizeOfVarString(name) + IOHelper.sizeOfArray(parameterDeclarations, (parameter) => parameter.size);

export const deserializeContractEventWireBase = ({ reader, context }: DeserializeWireBaseOptions): ContractEvent => {
  const name = reader.readVarString(252);
  const parameters = reader.readArray(() => ContractParameterDeclaration.deserializeWireBase({ reader, context }));

  return new ContractEvent({
    name,
    parameters,
  });
};
