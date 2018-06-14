import { Address, Fixed } from '@neo-one/smart-contract';
import { SimpleToken } from './SimpleToken';

export class BlueToken extends SimpleToken {
  public readonly name: string = 'BlueToken';
  public readonly symbol: string = 'BT';

  public constructor(owner: Address, amount: Fixed<8>) {
    super(owner, amount);
  }
}
