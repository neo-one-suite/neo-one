import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { BinaryWriter, IOHelper, utils } from '../utils';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export interface IntegerContractParameterJSON {
  readonly type: 'Integer';
  readonly value: string;
}

export class IntegerContractParameter extends ContractParameterBase<
  IntegerContractParameter,
  IntegerContractParameterJSON,
  ContractParameterType.Integer
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): IntegerContractParameter {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = utils.fromSignedBuffer(reader.readVarBytesLE());

    return new this(value);
  }

  public readonly type = ContractParameterType.Integer;
  public readonly value: BN;
  private readonly sizeInternal: () => number;

  public constructor(value: BN) {
    super();
    this.value = value;
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
      value: this.value.toString(10),
    };
  }
}
