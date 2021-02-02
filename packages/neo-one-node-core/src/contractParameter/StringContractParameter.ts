import { BinaryWriter, IOHelper, StringContractParameterJSON, utils } from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../Serializable';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class StringContractParameter extends ContractParameterBase<
  StringContractParameter,
  StringContractParameterJSON,
  ContractParameterType.String
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StringContractParameter {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readVarString();

    return new this(value);
  }

  public readonly type = ContractParameterType.String;
  public readonly value: string;
  private readonly sizeInternal: () => number;

  public constructor(value: string) {
    super();
    this.value = value;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfVarString(this.value));
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public asBuffer(): Buffer {
    return Buffer.from(this.value, 'utf8');
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarString(this.value);
  }

  public serializeJSON(): StringContractParameterJSON {
    return {
      type: 'String',
      value: this.value,
    };
  }
}
