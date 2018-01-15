/* @flow */
import { CONTRACT_PARAMETER_TYPE } from './ContractParameterType';
import ContractParameterBase from './ContractParameterBase';
import {
  type DeserializeWireBaseOptions,
  type SerializeJSONContext,
} from '../Serializable';

export type InteropInterfaceContractParameterJSON = {|
  type: 'InteropInterface',
|};

export default class InteropInterfaceContractParameter extends ContractParameterBase<
  InteropInterfaceContractParameter,
  InteropInterfaceContractParameterJSON,
  typeof CONTRACT_PARAMETER_TYPE.INTEROP_INTERFACE,
> {
  type = CONTRACT_PARAMETER_TYPE.INTEROP_INTERFACE;
  size: number = 0;

  static deserializeWireBase(options: DeserializeWireBaseOptions): this {
    super.deserializeContractParameterBaseWireBase(options);
    return new this();
  }

  serializeJSON(
    // eslint-disable-next-line
    context: SerializeJSONContext,
  ): InteropInterfaceContractParameterJSON {
    return {
      type: 'InteropInterface',
    };
  }
}
