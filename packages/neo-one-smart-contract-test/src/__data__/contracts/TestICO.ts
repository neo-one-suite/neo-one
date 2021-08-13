import { Address, constant, Fixed, Integer, SmartContract } from '@neo-one/smart-contract';
import { ICO, NEP17Token } from '@neo-one/smart-contract-lib';

export class TestICO extends ICO(NEP17Token(SmartContract)) {
  public readonly name: string = 'TestToken';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'TT';
  public readonly properties = {
    trusts: '*',
    groups: [],
    permissions: [],
  };
  public readonly icoStartTimeSeconds: Integer;
  public readonly icoDurationSeconds: Integer = 7 * 24 * 60 * 60; // 7 days * 24 hours * 60 minutes * 60 second
  public readonly amountPerNEO: Integer = 10;

  public constructor(public readonly owner: Address, startTimeSeconds: Integer) {
    super();
    this.icoStartTimeSeconds = startTimeSeconds;
  }

  @constant
  public getICOAmount(): Fixed<8> {
    return 5000_00000000;
  }
}
