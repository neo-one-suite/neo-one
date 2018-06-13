import { common, UInt256 } from '../common';
import {
  DeserializeWireBaseOptions,
  SerializeJSONContext,
} from '../Serializable';
import { BinaryWriter, IOHelper, JSONHelper, utils } from '../utils';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export interface Hash256ContractParameterJSON {
  type: 'Hash256';
  value: string;
}

export class Hash256ContractParameter extends ContractParameterBase<
  Hash256ContractParameter,
  Hash256ContractParameterJSON,
  ContractParameterType.Hash256
> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): Hash256ContractParameter {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readUInt256();

    return new this(value);
  }

  public readonly type = ContractParameterType.Hash256;
  public readonly value: UInt256;
  private readonly sizeInternal: () => number;

  constructor(value: UInt256) {
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

  public serializeJSON(
    context: SerializeJSONContext,
  ): Hash256ContractParameterJSON {
    return {
      type: 'Hash256',
      value: JSONHelper.writeUInt256(this.value),
    };
  }
}
