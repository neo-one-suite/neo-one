import { BinaryWriter, ContractParameterJSON, IOHelper, MapContractParameterJSON, utils } from '@neo-one/client-common';
import { SerializeJSONContext } from '../Serializable';
import { ContractParameter } from './ContractParameter';
import { ContractParameterBase } from './ContractParameterBase';
import { ContractParameterType } from './ContractParameterType';

export class MapContractParameter extends ContractParameterBase<
  MapContractParameter,
  MapContractParameterJSON,
  ContractParameterType.Map
> {
  public readonly type = ContractParameterType.Map;
  public readonly value: ReadonlyArray<readonly [ContractParameter, ContractParameter]>;
  private readonly sizeInternal: () => number;

  public constructor(value: ReadonlyArray<readonly [ContractParameter, ContractParameter]>) {
    super();
    this.value = value;
    this.sizeInternal = utils.lazy(() => IOHelper.sizeOfArray(this.value, (val) => val[0].size + val[1].size));
  }

  public get size(): number {
    return this.sizeInternal();
  }

  public asBoolean(): boolean {
    return this.value.length > 0;
  }

  public serializeWireBase(writer: BinaryWriter): void {
    super.serializeWireBase(writer);
    writer.writeArray(this.value, (parameter) =>
      writer.writeArray(parameter, (value) => value.serializeWireBase(writer)),
    );
  }

  // deserialize is monkey patched on later

  public serializeJSON(context: SerializeJSONContext): MapContractParameterJSON {
    return {
      type: 'Map' as const,
      value: this.value.map<readonly [ContractParameterJSON, ContractParameterJSON]>(
        (val) => [val[0].serializeJSON(context), val[1].serializeJSON(context)] as const,
      ),
    };
  }
}
