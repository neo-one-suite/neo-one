// tslint:disable no-implicit-dependencies
import { SmartContract } from '@neo-one/smart-contract';

export class Foo extends SmartContract {
  public readonly properties = {
    groups: [],
    permissions: [],
    trusts: '*',
  };

  public getFoo(): string {
    return 'foo';
  }
}
