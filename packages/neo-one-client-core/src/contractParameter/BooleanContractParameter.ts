import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { BinaryWriter, IOHelper, utils } from '../utils';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export interface BooleanContractParameterJSON {
  readonly type: 'Boolean';
  readonly value: boolean;
}

export class BooleanContractParameter extends ContractParameterBase<
  BooleanContractParameter,
  BooleanContractParameterJSON,
  ContractParameterType.Boolean
> {
  public static readonly TRUE = Buffer.from([1]);
  public static readonly FALSE = Buffer.from([0]);
  public static deserializeWireBase(options: DeserializeWireBaseOptions): BooleanContractParameter {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readBoolean();

    return new this(value);
  }

  public readonly type = ContractParameterType.Boolean;
  public readonly value: boolean;
  private readonly sizeInternal: () => number;

  public constructor(value: boolean) {
    super();
    this.value = value;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfBoolean);
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public asBuffer(): Buffer {
    return this.value ? BooleanContractParameter.TRUE : BooleanContractParameter.FALSE;
  }

  public asBoolean(): boolean {
    return this.value;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeBoolean(this.value);
  }

  public serializeJSON(_context: SerializeJSONContext): BooleanContractParameterJSON {
    return {
      type: 'Boolean',
      value: this.value,
    };
  }
}
