/* @flow */
import type { Wallet as LocalWallet } from './LocalKeyStore';

type Storage = {|
  setItem: (key: string, value: string) => Promise<void>,
  getItem: (key: string) => Promise<string>,
  removeItem: (key: string) => void,
  getAllKeys: () => Promise<Array<string>>,
|};

export default class LocalStringStore {
  type: string;
  storage: Storage;

  constructor({ type, storage }: {| type: string, storage: Storage |}) {
    this.type = type;
    this.storage = storage;
  }

  async getWallets(): Promise<Array<LocalWallet>> {
    const keys = await this.storage.getAllKeys();
    const values = await Promise.all(
      keys.map(key => this.storage.getItem(key)),
    );
    return values.map(value => JSON.parse(value));
  }

  async saveWallet(wallet: LocalWallet): Promise<void> {
    await this.storage.setItem(this._getKey(wallet), JSON.stringify(wallet));
  }

  async deleteWallet(wallet: LocalWallet): Promise<void> {
    await this.storage.removeItem(this._getKey(wallet));
  }

  _getKey({ account: { id: { network, address } } }: LocalWallet): string {
    return `${network}-${address}`;
  }
}
