import { Address, Deploy, Fixed } from '@neo-one/smart-contract';
import { SimpleToken } from './SimpleToken';

export class RedToken extends SimpleToken {
  public readonly name: string = 'RedToken';
  public readonly symbol: string = 'RT';
  public readonly properties = {
    trusts: '*',
    groups: [],
    permissions: [],
  };

  public constructor(owner: Address = Deploy.senderAddress, amount: Fixed<8> = 1_000_000_00000000) {
    super(owner, amount);
  }
}
