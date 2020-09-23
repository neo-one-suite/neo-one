import { NEP5NativeContract } from './Nep5';

export class GASToken extends NEP5NativeContract {
  public static readonly decimals: 8;
  public constructor() {
    super({
      id: -2,
      name: 'GAS',
      symbol: 'gas',
      decimals: 8,
    });
  }
}
