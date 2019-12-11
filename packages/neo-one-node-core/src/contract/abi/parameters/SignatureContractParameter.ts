import { BinaryWriter, IOHelper, JSONHelper, SignatureContractParameterJSON } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../../Serializable';
import { utils } from '../../../utils';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class SignatureContractParameter extends ContractParameterBase<
  SignatureContractParameter,
  SignatureContractParameterJSON,
  ContractParameterType.Signature
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): SignatureContractParameter {
    const { reader } = options;
    const { name } = super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readVarBytesLE();

    return new this(value, name);
  }

  public readonly type = ContractParameterType.Signature;
  public readonly name: string;
  public readonly value: Buffer;
  private readonly sizeInternal: () => number;

  public constructor(value: Buffer, name: string) {
    super();
    this.value = value;
    this.name = name;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfVarBytesLE(this.value));
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public asBuffer(): Buffer {
    return this.value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarBytesLE(this.value);
  }

  public serializeJSON(_context: SerializeJSONContext): SignatureContractParameterJSON {
    return {
      type: 'Signature',
      name: this.name,
      value: JSONHelper.writeBuffer(this.value),
    };
  }
}
