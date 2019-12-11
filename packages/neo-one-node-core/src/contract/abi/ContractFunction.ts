import {
  assertContractParameterType,
  ContractFunctionJSON,
  IOHelper,
  toJSONContractParameterType,
} from '@neo-one/client-common';
import { ContractFunctionModel } from '@neo-one/client-full-common';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../../Serializable';
import { BinaryReader, utils } from '../../utils';
import { ContractEventAdd } from './ContractEvent';
import { ContractParameterDeclaration, ContractParameterType } from './parameters';

export interface ContractFunctionAdd extends ContractEventAdd {
  readonly returnType: ContractParameterType;
}

export class ContractFunction extends ContractFunctionModel implements SerializableJSON<ContractFunctionJSON> {
  public get size(): number {
    return this.contractFunctionSizeInternal();
  }

  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractFunction {
    return deserializeContractFunctionWireBase({
      context: options.context,
      reader: options.reader,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractFunction {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly parameterDeclarations: readonly ContractParameterDeclaration[];

  private readonly contractFunctionSizeInternal = utils.lazy(() =>
    sizeOfContractFunction({
      name: this.name,
      parameterDeclarations: this.parameterDeclarations,
    }),
  );

  public constructor({ name, parameters, returnType }: ContractFunctionAdd) {
    super({ name, parameters, returnType });
    this.parameterDeclarations = parameters.map(
      (parameter) => new ContractParameterDeclaration({ name: parameter.name, type: parameter.type }),
    );
  }

  public serializeJSON(context: SerializeJSONContext): ContractFunctionJSON {
    return {
      name: this.name,
      parameters: this.parameterDeclarations.map((parameter) => parameter.serializeJSON(context)),
      returnType: toJSONContractParameterType(this.returnType),
    };
  }
}

export const sizeOfContractFunction = ({
  name,
  parameterDeclarations,
}: {
  readonly name: string;
  readonly parameterDeclarations: readonly ContractParameterDeclaration[];
}) =>
  IOHelper.sizeOfVarString(name) +
  IOHelper.sizeOfArray(parameterDeclarations, (parameter) => parameter.size) +
  // returnType
  IOHelper.sizeOfUInt8;

export const deserializeContractFunctionWireBase = ({
  reader,
  context,
}: DeserializeWireBaseOptions): ContractFunction => {
  const name = reader.readVarString(252);
  const parameters = reader.readArray(() => ContractParameterDeclaration.deserializeWireBase({ reader, context }));
  const returnType = assertContractParameterType(reader.readUInt8());

  return new ContractFunction({
    name,
    parameters,
    returnType,
  });
};
