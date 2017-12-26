/* @flow */
import type { LocalWallet } from '@neo-one/client';

import fs from 'fs-extra';
import path from 'path';

export default class LocalFileStore {
  _dataPath: string;

  constructor({ dataPath }: {| dataPath: string |}) {
    this._dataPath = dataPath;
  }

  async getWallets(): Promise<Array<LocalWallet>> {
    await fs.ensureDir(this._dataPath);
    const files = await fs.readdir(this._dataPath);
    return Promise.all(
      files.map(file => fs.readJSON(path.resolve(this._dataPath, file))),
    );
  }

  async saveWallet(wallet: LocalWallet): Promise<void> {
    await fs.writeJSON(this._getWalletPath(wallet), wallet);
  }

  async deleteWallet(wallet: LocalWallet): Promise<void> {
    await fs.remove(this._getWalletPath(wallet));
  }

  _getWalletPath({ account: { network, address } }: LocalWallet): string {
    return path.resolve(this._dataPath, `${network}-${address}.json`);
  }
}
