import { Address, Fixed, Integer, SmartContract } from '@neo-one/smart-contract';

import { ICO } from '../../ICO';
import { Token } from '../../Token';

export class TestICO extends ICO(Token(SmartContract)) {
  public readonly name: string = 'TestToken';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'TT';
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The TestICO',
  };
  public readonly icoStartTimeSeconds: Integer;
  public readonly icoDurationSeconds: Integer = 7 * 24 * 60 * 60; // 7 days * 24 hours * 60 minutes * 60 second
  public readonly amountPerNEO: Integer = 10;

  public constructor(public readonly owner: Address, startTimeSeconds: Integer) {
    super();
    this.icoStartTimeSeconds = startTimeSeconds;
  }

  public get icoAmount(): Fixed<8> {
    return 5000_00000000;
  }
}
