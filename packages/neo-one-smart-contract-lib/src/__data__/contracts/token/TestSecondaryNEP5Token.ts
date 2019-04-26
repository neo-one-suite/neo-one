import { Address, Deploy, Fixed } from '@neo-one/smart-contract';
// tslint:disable-next-line no-implicit-dependencies
import { SecondaryNEP5Token } from '@neo-one/smart-contract-lib';

export class TestSecondaryNEP5Token extends SecondaryNEP5Token {
  public readonly owner: Address;
  public readonly name: string = 'TestSecondaryNEP5Token';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'SN5T';
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The TestSecondaryNEP5Token',
  };
  public constructor(
    owner: Address = Deploy.senderAddress,
    amount: Fixed<8> = 1_000_000_00000000,
    protected readonly initialPrimary = Deploy.senderAddress,
  ) {
    super();
    this.initialPrimary = owner;
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.owner = owner;
    this.issue(owner, amount);
  }
  public primaryOnlyAction() {
    this.onlyPrimary();
  }
}
