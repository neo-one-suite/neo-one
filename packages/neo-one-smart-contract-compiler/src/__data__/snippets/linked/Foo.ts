// tslint:disable no-implicit-dependencies
import { Address, SmartContract } from '@neo-one/smart-contract';

export class Foo implements SmartContract {
  public readonly owner = Address.from('AXNajBTQLxWHwc9sKyXcc4UdbJvp3arYDG');
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'Foo',
    payable: true,
  };

  public getFoo(): string {
    return 'foo';
  }
}
