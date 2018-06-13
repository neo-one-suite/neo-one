import { PasswordRequiredError } from '../../errors';
import * as networks from '../../networks';
import { Wallet as LocalWallet } from './LocalKeyStore';

interface Storage {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string>;
  removeItem: (key: string) => Promise<void>;
  getAllKeys: () => Promise<string[]>;
}

export class LocalStringStore {
  public readonly type: string;
  public readonly storage: Storage;

  constructor({ type, storage }: { type: string; storage: Storage }) {
    this.type = type;
    this.storage = storage;
  }

  public async getWallets(): Promise<LocalWallet[]> {
    const keys = await this.storage.getAllKeys();
    const values = await Promise.all(
      keys.map((key) => this.storage.getItem(key)),
    );

    return values.map((value) => JSON.parse(value));
  }

  public async saveWallet(wallet: LocalWallet): Promise<void> {
    let safeWallet = wallet;
    if (wallet.account.id.network === networks.MAIN) {
      if (wallet.nep2 == null) {
        throw new PasswordRequiredError();
      }
      safeWallet = {
        type: 'locked',
        account: wallet.account,
        nep2: wallet.nep2,
      };
    }

    await this.storage.setItem(
      this.getKey(safeWallet),
      JSON.stringify(safeWallet),
    );
  }

  public async deleteWallet(wallet: LocalWallet): Promise<void> {
    await this.storage.removeItem(this.getKey(wallet));
  }

  private getKey({
    account: {
      id: { network, address },
    },
  }: LocalWallet): string {
    return `${network}-${address}`;
  }
}
