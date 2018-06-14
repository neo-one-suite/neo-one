import { DeserializeWireBaseOptions, SerializeJSONContext } from '../Serializable';
import { BinaryWriter, IOHelper, JSONHelper, utils } from '../utils';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export interface ByteArrayContractParameterJSON {
  readonly type: 'ByteArray';
  readonly value: string;
}

export class ByteArrayContractParameter extends ContractParameterBase<
  ByteArrayContractParameter,
  ByteArrayContractParameterJSON,
  ContractParameterType.ByteArray
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): ByteArrayContractParameter {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readVarBytesLE();

    return new this(value);
  }

  public readonly type = ContractParameterType.ByteArray;
  public readonly value: Buffer;
  private readonly sizeInternal: () => number;

  public constructor(value: Buffer) {
    super();
    this.value = value;
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

  public serializeJSON(_context: SerializeJSONContext): ByteArrayContractParameterJSON {
    return {
      type: 'ByteArray',
      value: JSONHelper.writeBuffer(this.value),
    };
  }
}
