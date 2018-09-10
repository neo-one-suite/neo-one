// tslint:disable no-console
import { SmartContract } from '@neo-one/smart-contract';

export class Contract extends SmartContract {
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'NEO•ONE Feature Test',
  };

  public myFirstMethod(): void {
    console.log('hello world');
  }
}
