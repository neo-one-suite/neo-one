/* @flow */
import { CONTRACT_PARAMETER_TYPE } from './ContractParameterType';
import { type BinaryWriter, JSONHelper } from '../utils';
import ContractParameterBase from './ContractParameterBase';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import common, { type UInt160 } from '../common';

export type Hash160ContractParameterJSON = {|
  type: 'Hash160',
  value: string,
|};

export default class Hash160ContractParameter extends ContractParameterBase<
  Hash160ContractParameter,
  Hash160ContractParameterJSON,
  typeof CONTRACT_PARAMETER_TYPE.HASH160,
> {
  type = CONTRACT_PARAMETER_TYPE.HASH160;
  value: UInt160;

  constructor(value: UInt160) {
    super();
    this.value = value;
  }

  asBuffer(): Buffer {
    return common.uInt160ToBuffer(this.value);
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt160(this.value);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readUInt160();

    return new this(value);
  }

  serializeJSON(
    // eslint-disable-next-line
    context: SerializeJSONContext,
  ): Hash160ContractParameterJSON {
    return {
      type: 'Hash160',
      value: JSONHelper.writeUInt160(this.value),
    };
  }
}
