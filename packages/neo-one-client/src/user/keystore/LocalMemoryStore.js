/* @flow */
import type { Wallet } from './LocalKeyStore';

export default class LocalMemoryStore {
  type: string;

  constructor(type?: string) {
    this.type = type == null ? 'memory' : type;
  }

  getWallets(): Promise<Array<Wallet>> {
    return Promise.resolve([]);
  }

  // eslint-disable-next-line
  saveWallet(wallet: Wallet): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line
  deleteWallet(wallet: Wallet): Promise<void> {
    return Promise.resolve();
  }
}
