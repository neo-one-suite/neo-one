import { InteropInterfaceContractParameterJSON } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializeJSONContext } from '../../../Serializable';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class InteropInterfaceContractParameter extends ContractParameterBase<
  InteropInterfaceContractParameter,
  InteropInterfaceContractParameterJSON,
  ContractParameterType.InteropInterface
> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): InteropInterfaceContractParameter {
    const { name } = super.deserializeContractParameterBaseWireBase(options);

    return new this(name);
  }

  public readonly type = ContractParameterType.InteropInterface;
  public readonly name: string;
  public readonly size: number = 0;

  public constructor(name: string) {
    super();
    this.name = name;
  }

  public serializeJSON(_context: SerializeJSONContext): InteropInterfaceContractParameterJSON {
    return {
      type: 'InteropInterface',
      name: this.name,
    };
  }
}
