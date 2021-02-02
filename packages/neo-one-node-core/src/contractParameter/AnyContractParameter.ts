import { AnyContractParameterJSON } from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../Serializable';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class AnyContractParameter extends ContractParameterBase<
  AnyContractParameter,
  AnyContractParameterJSON,
  ContractParameterType.Any
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): AnyContractParameter {
    super.deserializeContractParameterBaseWireBase(options);

    return new this();
  }

  public readonly type = ContractParameterType.Any;
  public readonly size: number = 0;

  public asBoolean(): boolean {
    return false;
  }

  public serializeJSON(): AnyContractParameterJSON {
    return {
      type: 'Any',
      value: undefined,
    };
  }
}
