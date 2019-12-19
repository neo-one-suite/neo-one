import {
  assertContractParameterType,
  common,
  ContractParameterDeclarationJSON,
  IOHelper,
  toJSONContractParameterType,
} from '@neo-one/client-common';
import { ContractParameterDeclarationModel } from '@neo-one/client-full-common';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableJSON } from '../../../Serializable';
import { BinaryReader, utils } from '../../../utils';
import { ContractParameterType } from './ContractParameterType';

export interface ContractParameterDeclarationAdd {
  readonly name: string;
  readonly type: ContractParameterType;
}

export class ContractParameterDeclaration extends ContractParameterDeclarationModel
  implements SerializableJSON<ContractParameterDeclarationJSON> {
  public static deserializeWireBase({ reader }: DeserializeWireBaseOptions): ContractParameterDeclaration {
    const type = assertContractParameterType(reader.readUInt8());
    // TODO: implement this
    // throw new Error(reader.remainingBuffer.toString('hex'));
    const name = reader.readVarString(common.MAX_CONTRACT_STRING);

    return new ContractParameterDeclaration({
      name,
      type,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): ContractParameterDeclaration {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  private readonly sizeInternal = utils.lazy(() => IOHelper.sizeOfVarString(this.name) + IOHelper.sizeOfUInt8);

  public get size(): number {
    return this.sizeInternal();
  }

  public clone(): ContractParameterDeclaration {
    return new ContractParameterDeclaration({
      name: this.name,
      type: this.type,
    });
  }

  public serializeJSON(): ContractParameterDeclarationJSON {
    return {
      name: this.name,
      type: toJSONContractParameterType(this.type),
    };
  }
}
