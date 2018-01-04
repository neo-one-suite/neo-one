/* @flow */
import { CONTRACT_PARAMETER_TYPE } from './ContractParameterType';
import { type BinaryWriter, JSONHelper } from '../utils';
import ContractParameterBase from './ContractParameterBase';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';
import common, { type ECPoint } from '../common';

export type PublicKeyContractParameterJSON = {|
  type: 'PublicKey',
  value: string,
|};

export default class PublicKeyContractParameter extends ContractParameterBase<
  PublicKeyContractParameter,
  PublicKeyContractParameterJSON,
  typeof CONTRACT_PARAMETER_TYPE.PUBLIC_KEY,
> {
  type = CONTRACT_PARAMETER_TYPE.PUBLIC_KEY;
  value: ECPoint;

  constructor(value: ECPoint) {
    super();
    this.value = value;
  }

  asBuffer(): Buffer {
    return common.ecPointToBuffer(this.value);
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeECPoint(this.value);
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    const { reader } = options;
    super.deserializeContractParameterBaseWireBase(options);
    const value = reader.readECPoint();

    return new this(value);
  }

  serializeJSON(
    // eslint-disable-next-line
    context: SerializeJSONContext,
  ): PublicKeyContractParameterJSON {
    return {
      type: 'PublicKey',
      value: JSONHelper.writeECPoint(this.value),
    };
  }
}
