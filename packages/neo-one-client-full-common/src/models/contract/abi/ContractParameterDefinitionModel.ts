import {
  ContractParameterDefinitionJSON,
  ContractParameterTypeModel,
  toJSONContractParameterType,
} from '@neo-one/client-common';

export interface ContractParameterDefinitionModelAdd {
  readonly type: ContractParameterTypeModel;
  readonly name: string;
}

export class ContractParameterDefinitionModel {
  public readonly type: ContractParameterTypeModel;
  public readonly name: string;

  public constructor({ type, name }: ContractParameterDefinitionModelAdd) {
    this.type = type;
    this.name = name;
  }

  public serializeJSON(): ContractParameterDefinitionJSON {
    return {
      name: this.name,
      type: toJSONContractParameterType(this.type),
    };
  }
}
