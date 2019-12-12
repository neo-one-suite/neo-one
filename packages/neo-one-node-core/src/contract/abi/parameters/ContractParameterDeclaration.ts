import {
  assertContractParameterType,
  ContractParameterDeclarationJSON,
  IOHelper,
  toJSONContractParameterType,
} from '@neo-one/client-common';
import { ContractParameterDeclarationModel } from '@neo-one/client-full-common';
import {
  DeserializeWireBaseOptions,
  DeserializeWireOptions,
  SerializableJSON,
  SerializeJSONContext,
} from '../../../Serializable';
import { BinaryReader, utils } from '../../../utils';
import { ContractParameterType } from './ContractParameterType';

export interface ContractParameterDeclarationAdd {
  readonly name: string;
  readonly type: ContractParameterType;
}

export class ContractParameterDeclaration extends ContractParameterDeclarationModel
  implements SerializableJSON<ContractParameterDeclarationJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ContractParameterDeclaration {
    return deserializeContractParameterDeclarationWireBase({
      context: options.context,
      reader: options.reader,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractParameterDeclaration {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly contractParameterDeclarationSizeInternal = utils.lazy(() =>
    sizeOfContractParameterDeclaration({
      name: this.name,
    }),
  );

  public get size(): number {
    return this.contractParameterDeclarationSizeInternal();
  }

  public serializeJSON(_context: SerializeJSONContext): ContractParameterDeclarationJSON {
    return {
      name: this.name,
      type: toJSONContractParameterType(this.type),
    };
  }
}

export const sizeOfContractParameterDeclaration = ({ name }: { readonly name: string }) =>
  IOHelper.sizeOfVarString(name) + IOHelper.sizeOfUInt8;

export const deserializeContractParameterDeclarationWireBase = ({
  reader,
}: DeserializeWireBaseOptions): ContractParameterDeclaration => {
  const type = assertContractParameterType(reader.readUInt8());
  // throw new Error(reader.remainingBuffer.toString('hex'));
  const name = reader.readVarString(252);

  return new ContractParameterDeclaration({
    name,
    type,
  });
};
