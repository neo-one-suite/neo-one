import { Address, verifySender } from '@neo-one/smart-contract';

import { Token } from '../../Token';

export class TestToken extends Token<4> {
  public readonly name: string = 'TestToken';
  public readonly decimals: 4 = 4;
  public readonly symbol: string = 'TT';

  constructor(owner: Address) {
    super(owner);
    verifySender(owner);
    this.issue(owner, 100_0000);
  }
}
