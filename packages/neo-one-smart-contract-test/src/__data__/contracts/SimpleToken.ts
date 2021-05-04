import { Address, Fixed, SmartContract } from '@neo-one/smart-contract';
import { NEP17Token } from '@neo-one/smart-contract-lib';

export abstract class SimpleToken extends NEP17Token(SmartContract) {
  public readonly owner: Address;
  public readonly decimals: 8 = 8;
  public readonly properties = {
    trusts: '*',
    groups: [],
    permissions: [],
  };

  public constructor(owner: Address, amount: Fixed<8>) {
    super();
    if (!Address.isCaller(owner)) {
      throw new Error('Sender was not the owner.');
    }
    this.owner = owner;
    this.issue(owner, amount);
  }
}
