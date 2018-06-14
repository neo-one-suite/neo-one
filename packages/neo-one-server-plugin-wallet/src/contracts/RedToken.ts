import { Address, Fixed } from '@neo-one/smart-contract';
import { SimpleToken } from './SimpleToken';

export class RedToken extends SimpleToken {
  public readonly name: string = 'RedToken';
  public readonly symbol: string = 'RT';

  public constructor(owner: Address, amount: Fixed<8>) {
    super(owner, amount);
  }
}
