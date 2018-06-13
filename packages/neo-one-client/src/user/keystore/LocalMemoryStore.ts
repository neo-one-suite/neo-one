import { Wallet } from './LocalKeyStore';

export class LocalMemoryStore {
  public readonly type: string;

  constructor(type?: string) {
    this.type = type == null ? 'memory' : type;
  }

  public getWallets(): Promise<Wallet[]> {
    return Promise.resolve([]);
  }

  public getWalletsSync(): Wallet[] {
    return [];
  }

  // eslint-disable-next-line
  public saveWallet(wallet: Wallet): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line
  public deleteWallet(wallet: Wallet): Promise<void> {
    return Promise.resolve();
  }
}
