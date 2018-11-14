// tslint:disable no-implicit-dependencies
import { Address, LinkedSmartContract, SmartContract } from '@neo-one/smart-contract';
import { Foo } from './Foo';

export class Bar extends SmartContract {
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'Bar',
  };

  public getFoo(expected: Address): string {
    LinkedSmartContract.for<Foo>();
    const foo = LinkedSmartContract.for<Foo>();

    if (!expected.equals(foo.address)) {
      return 'not foo';
    }

    return foo.getFoo();
  }
}
