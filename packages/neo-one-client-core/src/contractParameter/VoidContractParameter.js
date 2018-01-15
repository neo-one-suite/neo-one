/* @flow */
import { CONTRACT_PARAMETER_TYPE } from './ContractParameterType';
import ContractParameterBase from './ContractParameterBase';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';

export type VoidContractParameterJSON = {|
  type: 'Void',
|};

export default class VoidContractParameter extends ContractParameterBase<
  VoidContractParameter,
  VoidContractParameterJSON,
  typeof CONTRACT_PARAMETER_TYPE.VOID,
> {
  type = CONTRACT_PARAMETER_TYPE.VOID;
  size: number = 0;

  asBoolean(): boolean {
    return false;
  }

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    super.deserializeContractParameterBaseWireBase(options);
    return new this();
  }

  serializeJSON(
    // eslint-disable-next-line
    context: SerializeJSONContext,
  ): VoidContractParameterJSON {
    return {
      type: 'Void',
    };
  }
}
