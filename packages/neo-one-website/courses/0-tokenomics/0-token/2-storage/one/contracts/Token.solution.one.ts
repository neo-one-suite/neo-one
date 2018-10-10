import { constant, Fixed, SmartContract } from '@neo-one/smart-contract';

export class Token extends SmartContract {
  public readonly name = 'Eon';
  public readonly symbol = 'EON';
  public readonly decimals = 8;
  private mutableSupply: Fixed<8> = 0;

  @constant
  public get totalSupply(): Fixed<8> {
    return this.mutableSupply;
  }
}
