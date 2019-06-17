import { ArrayContractParameterJSON, BinaryWriter, IOHelper, utils } from '@neo-one/client-common';
import { SerializeJSONContext } from '../Serializable';
import { ContractParameter } from './ContractParameter';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class ArrayContractParameter extends ContractParameterBase<
  ArrayContractParameter,
  ArrayContractParameterJSON,
  ContractParameterType.Array
> {
  public readonly type = ContractParameterType.Array;
  public readonly value: readonly ContractParameter[];
  private readonly sizeInternal: () => number;

  public constructor(value: readonly ContractParameter[]) {
    super();
    this.value = value;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfArray(this.value, (val) => val.size));
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public asBoolean(): boolean {
    return this.value.length > 0;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(this.value, (parameter) => parameter.serializeWireBase(writer));
  }

  // deserialize is monkey patched on later

  public serializeJSON(context: SerializeJSONContext): ArrayContractParameterJSON {
    return {
      type: 'Array',
      value: this.value.map((val) => val.serializeJSON(context)),
    };
  }
}
