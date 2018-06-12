import { ContractParameterType } from './ContractParameterType';
import { ContractParameterBase } from './ContractParameterBase';
import {
  DeserializeWireBaseOptions,
  SerializeJSONContext,
} from '../Serializable';

export interface VoidContractParameterJSON {
  type: 'Void';
}

export class VoidContractParameter extends ContractParameterBase<
  VoidContractParameter,
  VoidContractParameterJSON,
  ContractParameterType.Void
> {
  public static deserializeWireBase(
    options: DeserializeWireBaseOptions,
  ): VoidContractParameter {
    super.deserializeContractParameterBaseWireBase(options);
    return new this();
  }

  public readonly type = ContractParameterType.Void;
  public readonly size: number = 0;

  public asBoolean(): boolean {
    return false;
  }

  public serializeJSON(
    context: SerializeJSONContext,
  ): VoidContractParameterJSON {
    return {
      type: 'Void',
    };
  }
}
