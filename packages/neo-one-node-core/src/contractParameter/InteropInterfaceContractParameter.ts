import { InteropInterfaceContractParameterJSON } from '@neo-one/client-common';
import { DeserializeWireBaseOptions } from '../Serializable';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class InteropInterfaceContractParameter extends ContractParameterBase<
  InteropInterfaceContractParameter,
  InteropInterfaceContractParameterJSON,
  ContractParameterType.InteropInterface
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): InteropInterfaceContractParameter {
    super.deserializeContractParameterBaseWireBase(options);

    return new this();
  }

  public readonly type = ContractParameterType.InteropInterface;
  public readonly size: number = 0;

  public serializeJSON(): InteropInterfaceContractParameterJSON {
    return {
      type: 'InteropInterface',
    };
  }
}
