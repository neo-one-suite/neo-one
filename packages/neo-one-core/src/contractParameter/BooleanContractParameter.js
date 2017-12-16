/* @flow */
import { CONTRACT_PARAMETER_TYPE } from './ContractParameterType';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import ContractParameterBase from './ContractParameterBase';

import { type BinaryWriter } from '../utils';

export type BooleanContractParameterJSON = {|
  type: 'Boolean',
  value: boolean,
|};

export default class BooleanContractParameter extends ContractParameterBase<
  BooleanContractParameter,
  BooleanContractParameterJSON,
  typeof CONTRACT_PARAMETER_TYPE.BOOLEAN,
> {
  static TRUE = Buffer.from([1]);
  static FALSE = Buffer.from([0]);

  type = CONTRACT_PARAMETER_TYPE.BOOLEAN;
  value: boolean;

  constructor(value: boolean) {
    super();
    this.value = value;
  }

  asBuffer(): Buffer {
    return this.value ? this.constructor.TRUE : this.constructor.FALSE;
  }

  asBoolean(): boolean {
    return this.value;
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeBoolean(this.value);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readBoolean();

    return new this(value);
  }

  serializeJSON(
    // eslint-disable-next-line
    context: SerializeJSONContext,
  ): BooleanContractParameterJSON {
    return {
      type: 'Boolean',
      value: this.value,
    };
  }
}
