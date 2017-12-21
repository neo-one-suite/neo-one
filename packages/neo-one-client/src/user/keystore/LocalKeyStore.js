/* @flow */
import type { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import _ from 'lodash';
import { common, crypto } from '@neo-one/core';
import { distinct, distinctUntilChanged } from 'rxjs/operators';
import { utils } from '@neo-one/utils';

import type {
  BufferString,
  UserAccount,
  Network,
  NetworkType,
  Witness,
} from '../../types'; // eslint-disable-line
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
  +getWallets: () => Promise<Array<Wallet>>,
  +saveWallet: (wallet: Wallet) => Promise<void>,
  +deleteWallet: (account: Wallet) => Promise<void>,
};

type WalletID = {|
  address: string,
  networkType: NetworkType,
|};

export default class LocalKeyStore {
  +currentAccount$: Observable<?UserAccount>;
  _currentAccount$: ReplaySubject<?UserAccount>;
  +accounts$: Observable<Array<UserAccount>>;
  _accounts$: ReplaySubject<Array<UserAccount>>;
  +wallets$: Observable<Array<Wallet>>;
  _wallets$: ReplaySubject<Array<Wallet>>;

  _currentAccount: ?UserAccount;
  wallets: Wallets;
  _store: Store;

  constructor({ store, wallets }: {| store: Store, wallets: Wallets |}) {
    this._accounts$ = new ReplaySubject(1);
    this.accounts$ = this._accounts$.pipe(
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
    );

    this._wallets$ = new ReplaySubject(1);
    this.wallets$ = this._wallets$.pipe(
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
    );

    this._currentAccount$ = new ReplaySubject(1);
    this.currentAccount$ = this._currentAccount$.pipe(distinct());

    this._currentAccount = null;
    this.wallets = wallets;
    this._store = store;

    this._updateAccounts$();
    this._newCurrentAccount$();
  }

  static async create({ store }: {| store: Store |}): Promise<LocalKeyStore> {
    const walletsList = await store.getWallets();
    const wallets = walletsList.reduce((acc, wallet) => {
      if (acc[wallet.account.networkType] == null) {
        acc[wallet.account.networkType] = {};
      }
      acc[wallet.account.networkType][wallet.account.address] = wallet;
      return acc;
    }, {});

    return new this({ wallets, store });
  }

  async sign({
    account,
    message,
  }: {|
    account: UserAccount,
    message: string,
  |}): Promise<Witness> {
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

  selectAccount(id: WalletID): void {
    const { account } = this.getWallet(id);
    this._currentAccount = account;
    this._currentAccount$.next(account);
  }

  getWallet({ address, networkType }: WalletID): Wallet {
    const wallets = this.wallets[networkType];
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
    network: Network,
    privateKey: BufferString,
    name?: string,
    password?: string,
  |}): Promise<Wallet> {
    const select = _.isEmpty(this.wallets);

    let privateKey = privateKeyIn;
    const publicKey = privateKeyToPublicKey(privateKey);
    const scriptHash = publicKeyToScriptHash(publicKey);
    const address = scriptHashToAddress({
      addressVersion: network.addressVersion,
      scriptHash,
    });

    let nep2;
    if (network.type === networks.MAIN.type || password != null) {
      if (password == null) {
        throw new PasswordRequiredError();
      }
      nep2 = await encryptNEP2({
        privateKey,
        password,
        addressVersion: network.addressVersion,
      });
      privateKey = undefined;
    }

    const wallet = {
      account: {
        type: 'file',
        networkType: network.type,
        addressVersion: network.addressVersion,
        name: name == null ? address : name,
        address,
        scriptHash,
        publicKey,
      },
      nep2,
      privateKey,
    };

    await this._store.saveWallet(wallet);

    if (this.wallets[wallet.account.networkType] == null) {
      this.wallets[wallet.account.networkType] = {};
    }

    if (
      this.wallets[wallet.account.networkType][wallet.account.address] == null
    ) {
      this.wallets[wallet.account.networkType][wallet.account.address] = wallet;
      this._updateAccounts$();
    }

    if (select) {
      this._currentAccount$.next(wallet.account);
    }

    return wallet;
  }

  async deleteAccount(id: WalletID): Promise<void> {
    const { account } = this.getWallet(id);
    await this._store.deleteWallet(
      this.wallets[account.networkType][account.address],
    );

    delete this.wallets[account.networkType][account.address];
    if (_.isEmpty(this.wallets[account.networkType])) {
      delete this.wallets[account.networkType];
    }

    this._updateAccounts$();

    if (
      this._currentAccount != null &&
      this._currentAccount.networkType === account.networkType &&
      this._currentAccount.address === account.address
    ) {
      this._newCurrentAccount$();
    }
  }

  async unlockWallet({
    id,
    password,
  }: {|
    id: WalletID,
    password: string,
  |}): Promise<void> {
    const wallet = this.getWallet(id);
    if (wallet.privateKey != null) {
      return;
    }

    if (wallet.nep2 == null) {
      throw new Error('Unexpected error, privateKey and NEP2 were both null.');
    }

    const privateKey = await decryptNEP2({
      addressVersion: wallet.account.addressVersion,
      encryptedKey: wallet.nep2,
      password,
    });

    this.wallets[wallet.account.networkType][wallet.account.address] = {
      account: wallet.account,
      privateKey,
      nep2: wallet.nep2,
    };
    this._updateWallets$();
  }

  lockWallet(id: WalletID): void {
    const wallet = this.getWallet(id);
    if (wallet.nep2 == null || wallet.privateKey == null) {
      return;
    }

    this.wallets[wallet.account.networkType][wallet.account.address] = {
      account: wallet.account,
      privateKey: null,
      nep2: wallet.nep2,
    };
    this._updateWallets$();
  }

  _getPrivateKey(account: UserAccount): BufferString {
    const wallet = this.getWallet({
      networkType: account.networkType,
      address: account.address,
    });

    if (wallet.privateKey == null) {
      throw new LockedAccountError(account.address);
    }

    return wallet.privateKey;
  }

  _updateAccounts$(): void {
    this._accounts$.next(this._getAllAccounts());
    this._updateWallets$();
  }

  _updateWallets$(): void {
    this._wallets$.next(this._getAllWallets());
  }

  _newCurrentAccount$(): void {
    const allAccounts = this._getAllAccounts();
    const account = allAccounts[0];
    this._currentAccount = account;
    this._currentAccount$.next(account);
  }

  _getAllAccounts(): Array<UserAccount> {
    return this._getAllWallets().map(({ account }) => account);
  }

  _getAllWallets(): Array<Wallet> {
    return _.flatten(
      utils.values(this.wallets).map(wallets => utils.values(wallets)),
    );
  }
}
