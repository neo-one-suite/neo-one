import { Address, SmartContract } from '@neo-one/smart-contract';
import { NEP17Token } from '@neo-one/smart-contract-lib';

export class TestToken extends NEP17Token(SmartContract) {
  public readonly owner: Address;
  public readonly name: string = 'TestToken';
  public readonly decimals: 8 = 8;
  public readonly symbol: string = 'TT';
  public readonly properties = {
    trusts: '*',
    groups: [],
    permissions: [],
  };

  public constructor(owner: Address) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.owner = owner;
    this.issue(owner, 100_00000000);
  }
}
