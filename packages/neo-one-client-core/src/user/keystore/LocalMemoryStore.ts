import { LocalStore, LocalWallet } from './LocalKeyStore';

/**
 * Dummy implementation of the `LocalStore` interface which causes the `LocalKeyStore` to be entirely in-memory.
 */
export class LocalMemoryStore implements LocalStore {
  public async getWallets(): Promise<ReadonlyArray<LocalWallet>> {
    return Promise.resolve([]);
  }

  public getWalletsSync(): ReadonlyArray<LocalWallet> {
    return [];
  }

  public async saveWallet(_wallet: LocalWallet): Promise<void> {
    return Promise.resolve();
  }

  public async deleteWallet(_wallet: LocalWallet): Promise<void> {
    return Promise.resolve();
  }
}
