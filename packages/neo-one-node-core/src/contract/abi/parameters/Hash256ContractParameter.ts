import {
  BinaryWriter,
  common,
  Hash256ContractParameterJSON,
  IOHelper,
  JSONHelper,
  UInt256,
  utils,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../../Serializable';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class Hash256ContractParameter extends ContractParameterBase<
  Hash256ContractParameter,
  Hash256ContractParameterJSON,
  ContractParameterType.Hash256
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Hash256ContractParameter {
    const { reader } = options;
    const { name } = super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readUInt256();

    return new this(value, name);
  }

  public readonly type = ContractParameterType.Hash256;
  public readonly name: string;
  public readonly value: UInt256;
  private readonly sizeInternal: () => number;

  public constructor(value: UInt256, name: string) {
    super();
    this.value = value;
    this.name = name;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt256);
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public asBuffer(): Buffer {
    return common.uInt256ToBuffer(this.value);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt256(this.value);
  }

  public serializeJSON(_context: SerializeJSONContext): Hash256ContractParameterJSON {
    return {
      type: 'Hash256',
      name: this.name,
      value: JSONHelper.writeUInt256(this.value),
    };
  }
}
