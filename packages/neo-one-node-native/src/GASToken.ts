import { NEP17NativeContract } from './Nep17';

export class GASToken extends NEP17NativeContract {
  public static readonly decimals: number = 8;
  public constructor() {
    super({
      id: -2,
      name: 'GasToken',
      symbol: 'GAS',
      decimals: 8,
    });
  }
}
