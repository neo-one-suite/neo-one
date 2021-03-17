import { BlockchainSettings, GASContract } from '@neo-one/node-core';
import { FungibleToken } from './FungibleToken';
import { gasTokenMethods } from './methods';

export class GASToken extends FungibleToken implements GASContract {
  public static readonly decimals: number = 8;
  public constructor(settings: BlockchainSettings) {
    super({
      name: 'GasToken',
      symbol: 'GAS',
      decimals: 8,
      methods: gasTokenMethods,
      settings,
    });
  }
}
