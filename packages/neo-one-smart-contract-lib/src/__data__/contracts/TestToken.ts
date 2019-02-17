import { Address, SmartContract } from '@neo-one/smart-contract';
// tslint:disable-next-line:no-implicit-dependencies
import { NEP5Token } from '@neo-one/smart-contract-lib';

export class TestToken extends NEP5Token(SmartContract) {
  public readonly owner: Address;
  public readonly name: string = 'TestToken';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'TT';
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The TestToken',
  };

  public constructor(owner: Address) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.owner = owner;
    this.issue(owner, 100_00000000);
  }
}
