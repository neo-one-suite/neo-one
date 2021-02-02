import {
  BinaryWriter,
  common,
  Hash256ContractParameterJSON,
  IOHelper,
  JSONHelper,
  UInt256,
  utils,
} from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../Serializable';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class Hash256ContractParameter extends ContractParameterBase<
  Hash256ContractParameter,
  Hash256ContractParameterJSON,
  ContractParameterType.Hash256
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): Hash256ContractParameter {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readUInt256();

    return new this(value);
  }

  public readonly type = ContractParameterType.Hash256;
  public readonly value: UInt256;
  private readonly sizeInternal: () => number;

  public constructor(value: UInt256) {
    super();
    this.value = value;
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

  public serializeJSON(): Hash256ContractParameterJSON {
    return {
      type: 'Hash256',
      value: JSONHelper.writeUInt256(this.value),
    };
  }
}
