import {
  BinaryWriter,
  common,
  Hash160ContractParameterJSON,
  IOHelper,
  JSONHelper,
  UInt160,
  utils,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../../Serializable';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class Hash160ContractParameter extends ContractParameterBase<
  Hash160ContractParameter,
  Hash160ContractParameterJSON,
  ContractParameterType.Hash160
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Hash160ContractParameter {
    const { reader } = options;
    const { name } = super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readUInt160();

    return new this(value, name);
  }

  public readonly type = ContractParameterType.Hash160;
  public readonly name: string;
  public readonly value: UInt160;
  private readonly sizeInternal: () => number;

  public constructor(value: UInt160, name: string) {
    super();
    this.value = value;
    this.name = name;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfUInt160);
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public asBuffer(): Buffer {
    return common.uInt160ToBuffer(this.value);
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt160(this.value);
  }

  public serializeJSON(_context: SerializeJSONContext): Hash160ContractParameterJSON {
    return {
      type: 'Hash160',
      name: this.name,
      value: JSONHelper.writeUInt160(this.value),
    };
  }
}
