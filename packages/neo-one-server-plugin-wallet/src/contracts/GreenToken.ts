import { Address, Fixed } from '@neo-one/smart-contract';
import { SimpleToken } from './SimpleToken';

export class GreenToken extends SimpleToken {
  public readonly name: string = 'GreenToken';
  public readonly symbol: string = 'GT';
  public readonly properties = {
    codeVersion: '1.0',
    author: 'dicarlo2',
    email: 'alex.dicarlo@neotracker.io',
    description: 'The GreenToken',
  };

  public constructor(owner: Address, amount: Fixed<8>) {
    super(owner, amount);
  }
}
