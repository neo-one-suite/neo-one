import { BlockchainSettings } from '@neo-one/node-core';
import { GASToken } from './GASToken';
import { NEOToken } from './NEOToken';
import { PolicyContract } from './Policy';

export class NativeContainer {
  public readonly NEO: NEOToken;
  public readonly GAS: GASToken;
  public readonly Policy: PolicyContract;

  public constructor(settings: BlockchainSettings) {
    this.NEO = new NEOToken(settings);
    this.GAS = new GASToken();
    this.Policy = new PolicyContract();
  }
}
