import { ContractParameterDeclaration, ContractParameterType } from '@neo-one/node-core';
import BN from 'bn.js';

export interface ContractMethodAttributeAdd {
  readonly name: string;
  readonly price: BN;
  readonly returnType: ContractParameterType;
  readonly parameters: readonly ContractParameterDeclaration[];
  readonly safeMethod: boolean;
}

export class ContractMethodAttribute {
  public readonly name: string;
  public readonly price: BN;
  public readonly returnType: ContractParameterType;
  public readonly parameters: readonly ContractParameterDeclaration[];
  public readonly safeMethod: boolean;

  public constructor({ name, price, returnType, parameters, safeMethod }: ContractMethodAttributeAdd) {
    this.name = name;
    this.price = price;
    this.returnType = returnType;
    this.parameters = parameters;
    this.safeMethod = safeMethod;
  }
}
