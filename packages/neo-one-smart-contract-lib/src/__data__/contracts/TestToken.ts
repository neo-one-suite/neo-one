import { Address, createEventNotifier, Fixed } from '@neo-one/smart-contract';
// tslint:disable-next-line no-implicit-dependencies
import { Token } from '@neo-one/smart-contract-lib';

const notifyTransfer = createEventNotifier<Address | undefined, Address | undefined, Fixed<4>>(
  'transfer',
  'from',
  'to',
  'amount',
);

export class TestToken extends Token<4> {
  public readonly owner: Address;
  public readonly name: string = 'TestToken';
  public readonly decimals: 4 = 4;
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
    this.issue(owner, 100_0000);
  }

  protected notifyTransfer(from: Address | undefined, to: Address | undefined, amount: Fixed<4>): void {
    notifyTransfer(from, to, amount);
  }
}
