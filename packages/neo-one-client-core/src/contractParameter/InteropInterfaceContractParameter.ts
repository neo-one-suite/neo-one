import { ContractParameterType } from './ContractParameterType';
import { ContractParameterBase } from './ContractParameterBase';
import {
  DeserializeWireBaseOptions,
  SerializeJSONContext,
} from '../Serializable';

export interface InteropInterfaceContractParameterJSON {
  type: 'InteropInterface';
}

export class InteropInterfaceContractParameter extends ContractParameterBase<
  InteropInterfaceContractParameter,
  InteropInterfaceContractParameterJSON,
  ContractParameterType.InteropInterface
> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): InteropInterfaceContractParameter {
    super.deserializeContractParameterBaseWireBase(options);
    return new this();
  }

  public readonly type = ContractParameterType.InteropInterface;
  public readonly size: number = 0;

  public serializeJSON(
    context: SerializeJSONContext,
  ): InteropInterfaceContractParameterJSON {
    return {
      type: 'InteropInterface',
    };
  }
}
