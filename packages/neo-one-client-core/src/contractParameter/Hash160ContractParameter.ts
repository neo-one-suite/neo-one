import { ContractParameterType } from './ContractParameterType';
import { ContractParameterBase } from './ContractParameterBase';
import {
  DeserializeWireBaseOptions,
  SerializeJSONContext,
} from '../Serializable';
import { common, UInt160 } from '../common';
import { utils, BinaryWriter, IOHelper, JSONHelper } from '../utils';

export interface Hash160ContractParameterJSON {
  type: 'Hash160';
  value: string;
}

export class Hash160ContractParameter extends ContractParameterBase<
  Hash160ContractParameter,
  Hash160ContractParameterJSON,
  ContractParameterType.Hash160
> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): Hash160ContractParameter {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readUInt160();

    return new this(value);
  }

  public readonly type = ContractParameterType.Hash160;
  public readonly value: UInt160;
  private readonly sizeInternal: () => number;

  constructor(value: UInt160) {
    super();
    this.value = value;
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

  public serializeJSON(
    context: SerializeJSONContext,
  ): Hash160ContractParameterJSON {
    return {
      type: 'Hash160',
      value: JSONHelper.writeUInt160(this.value),
    };
  }
}
