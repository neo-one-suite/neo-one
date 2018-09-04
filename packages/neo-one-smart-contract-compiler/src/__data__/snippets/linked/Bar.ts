// tslint:disable no-implicit-dependencies
import { Address, LinkedSmartContract, SmartContract } from '@neo-one/smart-contract';
import { Foo } from './Foo';

export class Bar implements SmartContract {
  public readonly owner = Address.from('AXNajBTQLxWHwc9sKyXcc4UdbJvp3arYDG');
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'Bar',
    payable: true,
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
