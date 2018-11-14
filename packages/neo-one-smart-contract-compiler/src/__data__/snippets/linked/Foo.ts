// tslint:disable no-implicit-dependencies
import { SmartContract } from '@neo-one/smart-contract';

export class Foo extends SmartContract {
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'Foo',
  };

  public getFoo(): string {
    return 'foo';
  }
}
