import { BlockchainSettings, StdLib as StdLibNode } from '@neo-one/node-core';
import { stdLibMethods } from './methods';
import { NativeContract } from './NativeContract';

export class StdLib extends NativeContract implements StdLibNode {
  public constructor(settings: BlockchainSettings) {
    super({
      name: 'StdLib',
      id: -2,
      methods: stdLibMethods,
      settings,
    });
  }
}
