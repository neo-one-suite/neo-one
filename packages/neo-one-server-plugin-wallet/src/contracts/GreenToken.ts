import { Address, Fixed } from '@neo-one/smart-contract';
import { SimpleToken } from './SimpleToken';

export class GreenToken extends SimpleToken {
  public readonly name: string = 'GreenToken';
  public readonly symbol: string = 'GT';

  constructor(owner: Address, amount: Fixed<8>) {
    super(owner, amount);
  }
}
