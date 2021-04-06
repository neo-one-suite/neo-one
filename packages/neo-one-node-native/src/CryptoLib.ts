import { BlockchainSettings, CryptoLib as CryptoLibNode } from '@neo-one/node-core';
import { cryptoLibMethods } from './methods';
import { NativeContract } from './NativeContract';

export class CryptoLib extends NativeContract implements CryptoLibNode {
  public constructor(settings: BlockchainSettings) {
    super({
      name: 'CryptoLib',
      id: -3,
      methods: cryptoLibMethods,
      settings,
    });
  }
}
