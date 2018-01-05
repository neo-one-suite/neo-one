import { Address, Integer, Fixed } from '@neo-one/smart-contract';

import { ICO } from '../../ICO';

export class TestICO extends ICO<8> {
  public readonly name: string = 'TestToken';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'TT';
  public readonly icoAmount: Fixed<8> = 5000_00000000;
  public readonly maxLimitedRoundAmount: Fixed<8> = 1_00000000;

  constructor(owner: Address, startTimeSeconds: Integer) {
    super(
      owner,
      startTimeSeconds,
      24 * 60 * 60, // 24 hours * 60 minutes * 60 seconds
      7 * 24 * 60 * 60, // 7 days * 24 hours * 60 minutes * 60 seconds
      5000_00000000,
    );
  }
}
