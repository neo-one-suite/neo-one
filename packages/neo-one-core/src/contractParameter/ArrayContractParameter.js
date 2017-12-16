/* @flow */
import { CONTRACT_PARAMETER_TYPE } from './ContractParameterType';
import { type BinaryWriter } from '../utils';
import ContractParameterBase from './ContractParameterBase';
import type {
  ContractParameter,
  ContractParameterJSON,
} from './ContractParameter';
import type { SerializeJSONContext } from '../Serializable';

export type ArrayContractParameterJSON = {|
  type: 'Array',
  // eslint-disable-next-line
  value: Array<ContractParameterJSON>,
|};

export default class ArrayContractParameter extends ContractParameterBase<
  ArrayContractParameter,
  ArrayContractParameterJSON,
  typeof CONTRACT_PARAMETER_TYPE.ARRAY,
> {
  type = CONTRACT_PARAMETER_TYPE.ARRAY;
  value: Array<ContractParameter>;

  constructor(value: Array<ContractParameter>) {
    super();
    this.value = value;
  }

  asBoolean(): boolean {
    return this.value.length > 0;
  }

  serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(this.value, parameter =>
      parameter.serializeWireBase(writer),
    );
  }

  // deserialize is monkey patched on later

  serializeJSON(context: SerializeJSONContext): ArrayContractParameterJSON {
    return {
      type: 'Array',
      value: this.value.map(val => val.serializeJSON(context)),
    };
  }
}
