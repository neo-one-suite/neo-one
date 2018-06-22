import { Address, createEventHandler, Fixed, verifySender } from '@neo-one/smart-contract';
// tslint:disable-next-line no-implicit-dependencies
import { Token } from '@neo-one/smart-contract-lib';

const onTransfer = createEventHandler<Address, Address, Fixed<4>>('transfer', 'from', 'to', 'amount');
const onApprove = createEventHandler<Address, Address, Fixed<4>>('approve', 'owner', 'spender', 'amount');

export class TestToken extends Token<4> {
  public readonly name: string = 'TestToken';
  public readonly decimals: 4 = 4;
  public readonly symbol: string = 'TT';
  protected readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The TestToken',
  };

  public constructor(owner: Address) {
    super(owner);
    verifySender(owner);
    this.issue(owner, 100_0000);
  }

  protected onTransfer(from: Address, to: Address, amount: Fixed<4>): void {
    onTransfer(from, to, amount);
  }

  protected onApprove(owner: Address, spender: Address, amount: Fixed<4>): void {
    onApprove(owner, spender, amount);
  }
}
