import { Address, SmartContract } from '@neo-one/smart-contract';

export class SourceMapContract implements SmartContract {
  public readonly owner: Address;
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'SourceMapContract',
  };
  private readonly constructorValue: number;

  public constructor(owner: Address, constructorValue: number) {
    this.owner = owner;
    this.constructorValue = constructorValue;
  }

  public getConstructorValue(): number {
    return this.constructorValue;
  }
}
