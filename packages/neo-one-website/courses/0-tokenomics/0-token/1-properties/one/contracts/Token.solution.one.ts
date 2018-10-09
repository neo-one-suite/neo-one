import { SmartContract } from '@neo-one/smart-contract';

export class Token extends SmartContract {
  public readonly name = 'Eon';
  public readonly symbol = 'EON';
  public readonly decimals = 8;
}
