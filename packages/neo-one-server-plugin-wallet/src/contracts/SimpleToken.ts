import {
  Address,
  Fixed,
  createEventHandler,
  verifySender,
} from '@neo-one/smart-contract';
import { Token } from '@neo-one/smart-contract-lib';

const onTransfer = createEventHandler<Address, Address, Fixed<8>>(
  'transfer',
  'from',
  'to',
  'amount',
);
const onApprove = createEventHandler<Address, Address, Fixed<8>>(
  'approve',
  'owner',
  'spender',
  'amount',
);

export class SimpleToken extends Token<8> {
  public readonly name: string = 'SimpleToken';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'ST';

  constructor(owner: Address) {
    super(owner);
    verifySender(owner);
    this.issue(owner, 100_0000);
  }

  protected onTransfer(from: Address, to: Address, amount: Fixed<8>): void {
    onTransfer(from, to, amount);
  }

  protected onApprove(
    owner: Address,
    spender: Address,
    amount: Fixed<8>,
  ): void {
    onApprove(owner, spender, amount);
  }
}
