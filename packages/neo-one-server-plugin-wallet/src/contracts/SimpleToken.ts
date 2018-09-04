import { Address, createEventNotifier, Fixed } from '@neo-one/smart-contract';
import { Token } from '@neo-one/smart-contract-lib';

const notifyTransfer = createEventNotifier<Address | undefined, Address | undefined, Fixed<8>>(
  'transfer',
  'from',
  'to',
  'amount',
);

export abstract class SimpleToken extends Token<8> {
  public readonly owner: Address;
  public readonly decimals: 8 = 8;

  public constructor(owner: Address, amount: Fixed<8>) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.owner = owner;
    this.issue(owner, amount);
  }

  protected notifyTransfer(from: Address | undefined, to: Address | undefined, amount: Fixed<8>): void {
    notifyTransfer(from, to, amount);
  }
}
