/* istanbul ignore file */
import { SmartContract, Address } from '@neo-one/smart-contract';

export class SourceMapContract extends SmartContract {
  private constructorValue: number;
  protected readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'SourceMapContract',
  };

  public constructor(address: Address, constructorValue: number) {
    super(address);
    this.constructorValue = constructorValue;
  }

  public getConstructorValue(): number {
    return this.constructorValue;
  }
}
