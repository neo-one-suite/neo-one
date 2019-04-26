import { Address, Deploy, Fixed, SmartContract } from '@neo-one/smart-contract';
// tslint:disable-next-line no-implicit-dependencies
import { NEP5Token } from '@neo-one/smart-contract-lib';

export class TestNEP5Token extends NEP5Token(SmartContract) {
  public readonly owner: Address;
  public readonly name: string = 'TestNEP5Token';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'TT';
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The TestNEP5Token',
  };
  public constructor(owner: Address = Deploy.senderAddress, amount: Fixed<8> = 1_000_000_00000000) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.owner = owner;
    this.issue(owner, amount);
  }
}
