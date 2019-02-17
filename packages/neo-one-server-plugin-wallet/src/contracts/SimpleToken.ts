import { Address, Fixed, SmartContract } from '@neo-one/smart-contract';
import { NEP5Token } from '@neo-one/smart-contract-lib';

export abstract class SimpleToken extends NEP5Token(SmartContract) {
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
}
