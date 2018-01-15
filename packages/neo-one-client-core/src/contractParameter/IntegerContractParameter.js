/* @flow */
import type BN from 'bn.js';

import { CONTRACT_PARAMETER_TYPE } from './ContractParameterType';
import ContractParameterBase from './ContractParameterBase';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';

import utils, { type BinaryWriter, IOHelper } from '../utils';

export type IntegerContractParameterJSON = {|
  type: 'Integer',
  value: string,
|};

export default class IntegerContractParameter extends ContractParameterBase<
  IntegerContractParameter,
  IntegerContractParameterJSON,
  typeof CONTRACT_PARAMETER_TYPE.INTEGER,
> {
  type = CONTRACT_PARAMETER_TYPE.INTEGER;
  value: BN;

  __size: () => number;

  constructor(value: BN) {
    super();
    this.value = value;
    this.__size = utils.lazy(() =>
      IOHelper.sizeOfVarBytesLE(utils.toSignedBuffer(this.value)),
    );
  }

  get size(): number {
    return this.__size();
  }

  asBoolean(): boolean {
    return !this.value.isZero();
  }

  asBuffer(): Buffer {
    return utils.toSignedBuffer(this.value);
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeVarBytesLE(utils.toSignedBuffer(this.value));
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = utils.fromSignedBuffer(reader.readVarBytesLE());

    return new this(value);
  }

  serializeJSON(
    // eslint-disable-next-line
    context: SerializeJSONContext,
  ): IntegerContractParameterJSON {
    return {
      type: 'Integer',
      value: this.value.toString(10),
    };
  }
}
