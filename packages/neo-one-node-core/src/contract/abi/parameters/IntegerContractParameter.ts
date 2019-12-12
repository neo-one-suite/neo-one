import { BinaryWriter, IntegerContractParameterJSON, IOHelper, utils } from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../../Serializable';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class IntegerContractParameter extends ContractParameterBase<
  IntegerContractParameter,
  IntegerContractParameterJSON,
  ContractParameterType.Integer
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): IntegerContractParameter {
    const { reader } = options;
    const { name } = super.deserializeContractParameterBaseWireBase(options);
    const value = utils.fromSignedBuffer(reader.readVarBytesLE());

    return new this(value, name);
  }

  public readonly type = ContractParameterType.Integer;
  public readonly name: string;
  public readonly value: BN;
  private readonly sizeInternal: () => number;

  public constructor(value: BN, name: string) {
    super();
    this.value = value;
    this.name = name;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfVarBytesLE(utils.toSignedBuffer(this.value)));
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public asBoolean(): boolean {
    return !this.value.isZero();
  }

  public asBuffer(): Buffer {
    return utils.toSignedBuffer(this.value);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarBytesLE(utils.toSignedBuffer(this.value));
  }

  public serializeJSON(_context: SerializeJSONContext): IntegerContractParameterJSON {
    return {
      type: 'Integer',
      name: this.name,
      value: this.value.toString(10),
    };
  }
}
