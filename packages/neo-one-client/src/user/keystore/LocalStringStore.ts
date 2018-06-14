import { PasswordRequiredError } from '../../errors';
import * as networks from '../../networks';
import { Wallet as LocalWallet } from './LocalKeyStore';

interface Storage {
  readonly setItem: (key: string, value: string) => Promise<void>;
  readonly getItem: (key: string) => Promise<string>;
  readonly removeItem: (key: string) => Promise<void>;
  readonly getAllKeys: () => Promise<ReadonlyArray<string>>;
}

export class LocalStringStore {
  public readonly type: string;
  public readonly storage: Storage;

  public constructor({ type, storage }: { readonly type: string; readonly storage: Storage }) {
    this.type = type;
    this.storage = storage;
  }

  public async getWallets(): Promise<ReadonlyArray<LocalWallet>> {
    const keys = await this.storage.getAllKeys();
    const values = await Promise.all(keys.map(async (key) => this.storage.getItem(key)));

    return values.map((value) => JSON.parse(value));
  }

  public async saveWallet(wallet: LocalWallet): Promise<void> {
    let safeWallet = wallet;
    if (wallet.account.id.network === networks.MAIN) {
      if (wallet.nep2 === undefined) {
        throw new PasswordRequiredError();
      }
      safeWallet = {
        type: 'locked',
        account: wallet.account,
        nep2: wallet.nep2,
      };
    }

    await this.storage.setItem(this.getKey(safeWallet), JSON.stringify(safeWallet));
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
