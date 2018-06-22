import { Address, Fixed } from '@neo-one/smart-contract';
import { SimpleToken } from './SimpleToken';

export class BlueToken extends SimpleToken {
  public readonly name: string = 'BlueToken';
  public readonly symbol: string = 'BT';
  protected readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The BlueToken',
  };

  public constructor(owner: Address, amount: Fixed<8>) {
    super(owner, amount);
  }
}
