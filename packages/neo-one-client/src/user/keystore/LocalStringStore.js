/* @flow */
import { PasswordRequiredError } from '../../errors';
import type { Wallet as LocalWallet } from './LocalKeyStore';

import * as networks from '../../networks';

type Storage = {|
  setItem: (key: string, value: string) => Promise<void>,
  getItem: (key: string) => Promise<string>,
  removeItem: (key: string) => Promise<void>,
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
      this._getKey(safeWallet),
      JSON.stringify(safeWallet),
    );
  }

  async deleteWallet(wallet: LocalWallet): Promise<void> {
    await this.storage.removeItem(this._getKey(wallet));
  }

  _getKey({ account: { id: { network, address } } }: LocalWallet): string {
    return `${network}-${address}`;
  }
}
