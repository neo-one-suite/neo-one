import { SmartContract } from '@neo-one/smart-contract';

export class SourceMapContract extends SmartContract {
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'SourceMapContract',
  };
  private readonly constructorValue: number;

  public constructor(constructorValue: number) {
    super();
    this.constructorValue = constructorValue;
  }

  public getConstructorValue(): number {
    return this.constructorValue;
  }
}
