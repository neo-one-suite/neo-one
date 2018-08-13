import { Address, createEventNotifier, Fixed, Integer } from '@neo-one/smart-contract';

import { ICO } from '../../ICO';

const notifyTransfer = createEventNotifier<Address | undefined, Address | undefined, Fixed<8>>(
  'transfer',
  'from',
  'to',
  'amount',
);

export class TestICO extends ICO<8> {
  public readonly name: string = 'TestToken';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'TT';
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The TestICO',
    payable: true,
  };

  public constructor(public readonly owner: Address, startTimeSeconds: Integer) {
    super(
      startTimeSeconds,
      7 * 24 * 60 * 60, // 7 days * 24 hours * 60 minutes * 60 seconds
      5000_00000000,
      10,
    );
  }

  protected notifyTransfer(from: Address | undefined, to: Address | undefined, amount: Fixed<8>): void {
    notifyTransfer(from, to, amount);
  }
}
