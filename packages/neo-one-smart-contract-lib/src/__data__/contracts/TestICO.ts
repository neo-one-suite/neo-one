/* istanbul ignore file */
import { Address, createEventHandler, Fixed, Integer } from '@neo-one/smart-contract';

import { ICO } from '../../ICO';

const onTransfer = createEventHandler<Address, Address, Fixed<8>>('transfer', 'from', 'to', 'amount');
const onApprove = createEventHandler<Address, Address, Fixed<8>>('approve', 'owner', 'spender', 'amount');

export class TestICO extends ICO<8> {
  public readonly name: string = 'TestToken';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'TT';
  public readonly icoAmount: Fixed<8> = 5000_00000000;
  public readonly maxLimitedRoundAmount: Fixed<8> = 1_00000000;
  protected readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The TestICO',
  };

  public constructor(owner: Address, startTimeSeconds: Integer) {
    super(
      owner,
      startTimeSeconds,
      24 * 60 * 60, // 24 hours * 60 minutes * 60 seconds
      7 * 24 * 60 * 60, // 7 days * 24 hours * 60 minutes * 60 seconds
      5000_00000000,
    );
  }

  protected onTransfer(from: Address, to: Address, amount: Fixed<8>): void {
    onTransfer(from, to, amount);
  }

  protected onApprove(owner: Address, spender: Address, amount: Fixed<8>): void {
    onApprove(owner, spender, amount);
  }
}
