/* @flow */
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import type { Observable } from 'rxjs/Observable';

import _ from 'lodash';
import { common, crypto } from '@neo-one/core';
import { distinct, distinctUntilChanged, map } from 'rxjs/operators';
import { utils } from '@neo-one/utils';

import type {
  BufferString,
  UserAccount,
  UserAccountID,
  NetworkType,
  Witness,
} from '../../types';
import {
  LockedAccountError,
  PasswordRequiredError,
  UnknownAccountError,
} from '../../errors';

import {
  decryptNEP2,
  encryptNEP2,
  privateKeyToPublicKey,
  publicKeyToScriptHash,
  scriptHashToAddress,
} from '../../helpers';
import * as networks from '../../networks';

export type Wallet = {|
  account: UserAccount,
  privateKey: ?BufferString,
  nep2: ?string,
|};
export type Wallets = {
  [network: string]: { [address: string]: Wallet },
};
export type Store = {
  +type: string,
  +getWallets: () => Promise<Array<Wallet>>,
  +saveWallet: (wallet: Wallet) => Promise<void>,
  +deleteWallet: (account: Wallet) => Promise<void>,
};

const flattenWallets = (wallets: Wallets) =>
  _.flatten(
    utils.values(wallets).map(networkWallets => utils.values(networkWallets)),
  );

export default class LocalKeyStore {
  +currentAccount$: Observable<?UserAccount>;
  +accounts$: Observable<Array<UserAccount>>;
  +wallets$: Observable<Array<Wallet>>;

  _currentAccount$: BehaviorSubject<?UserAccount>;
  _wallets$: BehaviorSubject<Wallets>;

  _store: Store;

  _initPromise: Promise<void>;

  constructor({ store }: {| store: Store |}) {
    this._wallets$ = new BehaviorSubject({});
    this.wallets$ = this._wallets$.pipe(
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
      map(wallets => flattenWallets(wallets)),
    );

    this.accounts$ = this.wallets$.pipe(
      map(wallets => wallets.map(({ account }) => account)),
    );

    this._currentAccount$ = new BehaviorSubject(null);
    this.currentAccount$ = this._currentAccount$.pipe(distinct());

    this._store = store;

    this._initPromise = this._init();
  }

  async _init(): Promise<void> {
    const walletsList = await this._store.getWallets();
    const wallets = walletsList.reduce((acc, wallet) => {
      if (acc[wallet.account.id.network] == null) {
        acc[wallet.account.id.network] = {};
      }
      acc[wallet.account.id.network][wallet.account.id.address] = wallet;
      return acc;
    }, {});
    this._wallets$.next(wallets);
    this._newCurrentAccount();
  }

  get wallets(): Wallets {
    return this._wallets$.getValue();
  }

  get currentAccount(): ?UserAccount {
    return this._currentAccount$.getValue();
  }

  async sign({
    account,
    message,
  }: {|
    account: UserAccountID,
    message: string,
  |}): Promise<Witness> {
    await this._initPromise;

    const privateKey = this._getPrivateKey(account);
    const witness = crypto.createWitness(
      Buffer.from(message, 'hex'),
      common.stringToPrivateKey(privateKey),
    );
    return {
      verification: witness.verification.toString('hex'),
      invocation: witness.invocation.toString('hex'),
    };
  }

  selectAccount(id: UserAccountID): void {
    const { account } = this.getWallet(id);
    this._currentAccount$.next(account);
  }

  getWallet({ address, network }: UserAccountID): Wallet {
    const wallets = this.wallets[network];
    if (wallets == null) {
      throw new UnknownAccountError(address);
    }

    const wallet = wallets[address];
    if (wallet == null) {
      throw new UnknownAccountError(address);
    }

    return wallet;
  }

  async addAccount({
    network,
    privateKey: privateKeyIn,
    name,
    password,
  }: {|
    network: NetworkType,
    privateKey: BufferString,
    name?: string,
    password?: string,
  |}): Promise<Wallet> {
    await this._initPromise;

    let privateKey = privateKeyIn;
    const publicKey = privateKeyToPublicKey(privateKey);
    const scriptHash = publicKeyToScriptHash(publicKey);
    const address = scriptHashToAddress(scriptHash);

    let nep2;
    if (network === networks.MAIN || password != null) {
      if (password == null) {
        throw new PasswordRequiredError();
      }
      nep2 = await encryptNEP2({ privateKey, password });
      privateKey = undefined;
    }

    const wallet = {
      account: {
        type: this._store.type,
        id: {
          network,
          address,
        },
        name: name == null ? address : name,
        scriptHash,
        publicKey,
      },
      nep2,
      privateKey,
    };

    await this._store.saveWallet(wallet);
    this._updateWallet(wallet);

    if (this.currentAccount == null) {
      this._currentAccount$.next(wallet.account);
    }

    return wallet;
  }

  async deleteAccount(id: UserAccountID): Promise<void> {
    await this._initPromise;

    const { wallets } = this;
    const networkWalletsIn = wallets[id.network];
    if (networkWalletsIn == null) {
      return;
    }

    const networkWallets = { ...networkWalletsIn };
    const wallet = networkWallets[id.address];
    if (wallet == null) {
      return;
    }

    delete networkWallets[id.network][id.address];
    await this._store.deleteWallet(wallet);
    this._wallets$.next({
      ...wallets,
      [id.network]: networkWallets,
    });

    if (
      this.currentAccount != null &&
      this.currentAccount.network === id.network &&
      this.currentAccount.address === id.address
    ) {
      this._newCurrentAccount();
    }
  }

  async unlockWallet({
    id,
    password,
  }: {|
    id: UserAccountID,
    password: string,
  |}): Promise<void> {
    await this._initPromise;

    const wallet = this.getWallet(id);
    if (wallet.privateKey != null) {
      return;
    }

    if (wallet.nep2 == null) {
      throw new Error('Unexpected error, privateKey and NEP2 were both null.');
    }

    const privateKey = await decryptNEP2({
      encryptedKey: wallet.nep2,
      password,
    });

    this._updateWallet({
      account: wallet.account,
      privateKey,
      nep2: wallet.nep2,
    });
  }

  lockWallet(id: UserAccountID): void {
    const wallet = this.getWallet(id);
    if (wallet.nep2 == null || wallet.privateKey == null) {
      return;
    }

    this._updateWallet({
      account: wallet.account,
      privateKey: null,
      nep2: wallet.nep2,
    });
  }

  _getPrivateKey(id: UserAccountID): BufferString {
    const wallet = this.getWallet({
      network: id.network,
      address: id.address,
    });

    if (wallet.privateKey == null) {
      throw new LockedAccountError(id.address);
    }

    return wallet.privateKey;
  }

  _updateWallet(wallet: Wallet): void {
    const { wallets } = this;
    this._wallets$.next({
      ...wallets,
      [wallet.account.id.network]: {
        ...(wallets[wallet.account.id.network] || {}),
        [wallet.account.id.address]: wallet,
      },
    });
  }

  _newCurrentAccount(): void {
    const allAccounts = flattenWallets(this.wallets).map(
      ({ account }) => account,
    );
    const account = allAccounts[0];
    this._currentAccount$.next(account);
  }
}
