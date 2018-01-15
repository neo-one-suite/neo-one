/* @flow */
import { CONTRACT_PARAMETER_TYPE } from './ContractParameterType';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import ContractParameterBase from './ContractParameterBase';

import utils, { type BinaryWriter, IOHelper, JSONHelper } from '../utils';

export type ByteArrayContractParameterJSON = {|
  type: 'ByteArray',
  value: string,
|};

export default class ByteArrayContractParameter extends ContractParameterBase<
  ByteArrayContractParameter,
  ByteArrayContractParameterJSON,
  typeof CONTRACT_PARAMETER_TYPE.BYTE_ARRAY,
> {
  type = CONTRACT_PARAMETER_TYPE.BYTE_ARRAY;
  value: Buffer;

  __size: () => number;

  constructor(value: Buffer) {
    super();
    this.value = value;
    this.__size = utils.lazy(() => IOHelper.sizeOfVarBytesLE(this.value));
  }

  get size(): number {
    return this.__size();
  }

  asBuffer(): Buffer {
    return this.value;
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarBytesLE(this.value);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readVarBytesLE();

    return new this(value);
  }

  serializeJSON(
    // eslint-disable-next-line
    context: SerializeJSONContext,
  ): ByteArrayContractParameterJSON {
    return {
      type: 'ByteArray',
      value: JSONHelper.writeBuffer(this.value),
    };
  }
}
