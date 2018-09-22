import { Wallet } from './LocalKeyStore';

export class LocalMemoryStore {
  public readonly type: string;

  public constructor(type?: string) {
    this.type = type === undefined ? 'memory' : type;
  }

  public async getWallets(): Promise<ReadonlyArray<Wallet>> {
    return Promise.resolve([]);
  }

  public getWalletsSync(): ReadonlyArray<Wallet> {
    return [];
  }

  public async saveWallet(_wallet: Wallet): Promise<void> {
    return Promise.resolve();
  }

  public async deleteWallet(_wallet: Wallet): Promise<void> {
    return Promise.resolve();
  }
}
