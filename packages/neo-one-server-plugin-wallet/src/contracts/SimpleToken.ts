import { Address, createEventHandler, Fixed, verifySender } from '@neo-one/smart-contract';
import { Token } from '@neo-one/smart-contract-lib';

const onTransfer = createEventHandler<Address | undefined, Address | undefined, Fixed<8>>(
  'transfer',
  'from',
  'to',
  'amount',
);
const onApprove = createEventHandler<Address, Address, Fixed<8>>('approve', 'owner', 'spender', 'amount');

export abstract class SimpleToken extends Token<8> {
  public readonly decimals: 8 = 8;

  public constructor(owner: Address, amount: Fixed<8>) {
    super(owner);
    verifySender(owner);
    this.issue(owner, amount);
  }

  protected onTransfer(from: Address | undefined, to: Address | undefined, amount: Fixed<8>): void {
    onTransfer(from, to, amount);
  }

  protected onApprove(owner: Address, spender: Address, amount: Fixed<8>): void {
    onApprove(owner, spender, amount);
  }
}
