/* @flow */
import { CONTRACT_PARAMETER_TYPE } from './ContractParameterType';
import ContractParameterBase from './ContractParameterBase';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import common, { type UInt256 } from '../common';
import utils, { type BinaryWriter, IOHelper, JSONHelper } from '../utils';

export type Hash256ContractParameterJSON = {|
  type: 'Hash256',
  value: string,
|};

export default class Hash256ContractParameter extends ContractParameterBase<
  Hash256ContractParameter,
  Hash256ContractParameterJSON,
  typeof CONTRACT_PARAMETER_TYPE.HASH256,
> {
  type = CONTRACT_PARAMETER_TYPE.HASH256;
  value: UInt256;

  __size: () => number;

  constructor(value: UInt256) {
    super();
    this.value = value;
    this.__size = utils.lazy(() => IOHelper.sizeOfUInt256);
  }

  get size(): number {
    return this.__size();
  }

  asBuffer(): Buffer {
    return common.uInt256ToBuffer(this.value);
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeUInt256(this.value);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readUInt256();

    return new this(value);
  }

  serializeJSON(
    // eslint-disable-next-line
    context: SerializeJSONContext,
  ): Hash256ContractParameterJSON {
    return {
      type: 'Hash256',
      value: JSONHelper.writeUInt256(this.value),
    };
  }
}
