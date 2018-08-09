import { SmartContract, Address } from '@neo-one/smart-contract';

export class SourceMapContract implements SmartContract {
  private constructorValue: number;
  public readonly owner: Address;
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'SourceMapContract',
    payable: false,
  };

  public constructor(owner: Address, constructorValue: number) {
    this.owner = owner;
    this.constructorValue = constructorValue;
  }

  public getConstructorValue(): number {
    return this.constructorValue;
  }
}
