import { Monitor } from '@neo-one/monitor';
import { Observable, BehaviorSubject } from 'rxjs';
import _ from 'lodash';
import { common, crypto } from '@neo-one/client-core';
import { distinctUntilChanged, map } from 'rxjs/operators';
import {
  BufferString,
  UserAccount,
  UserAccountID,
  NetworkType,
  UpdateAccountNameOptions,
  Witness,
} from '../../types';
import { LockedAccountError, UnknownAccountError } from '../../errors';
import {
  decryptNEP2,
  encryptNEP2,
  privateKeyToPublicKey,
  publicKeyToScriptHash,
  scriptHashToAddress,
} from '../../helpers';

export interface LockedWallet {
  type: 'locked';
  account: UserAccount;
  nep2: string;
}

export interface UnlockedWallet {
  type: 'unlocked';
  account: UserAccount;
  privateKey: BufferString;
  nep2?: string | null;
}

export type Wallet = LockedWallet | UnlockedWallet;
export interface Wallets {
  [network: string]: { [address: string]: Wallet };
}

export interface Store {
  readonly type: string;
  readonly getWallets: () => Promise<Wallet[]>;
  readonly getWalletsSync?: () => Wallet[];
  readonly saveWallet: (wallet: Wallet, monitor?: Monitor) => Promise<void>;
  readonly deleteWallet: (account: Wallet, monitor?: Monitor) => Promise<void>;
}

const flattenWallets = (wallets: Wallets) =>
  _.flatten(
    Object.values(wallets).map((networkWallets) =>
      Object.values(networkWallets),
    ),
  );

export class LocalKeyStore {
  public readonly type: string;
  public readonly currentAccount$: Observable<UserAccount | null>;
  public readonly accounts$: Observable<UserAccount[]>;
  public readonly wallets$: Observable<Wallet[]>;
  private readonly currentAccountInternal$: BehaviorSubject<UserAccount | null>;
  private readonly accountsInternal$: BehaviorSubject<UserAccount[]>;
  private readonly walletsInternal$: BehaviorSubject<Wallets>;
  private readonly store: Store;
  private readonly initPromise: Promise<void>;

  constructor({ store }: { store: Store }) {
    this.type = store.type;
    this.walletsInternal$ = new BehaviorSubject({});
    this.wallets$ = this.walletsInternal$.pipe(
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
      map((wallets) => flattenWallets(wallets)),
    );

    this.accountsInternal$ = new BehaviorSubject([] as UserAccount[]);
    this.wallets$
      .pipe(map((wallets) => wallets.map(({ account }) => account)))
      .subscribe(this.accountsInternal$);
    this.accounts$ = this.accountsInternal$;

    this.currentAccountInternal$ = new BehaviorSubject(
      null as UserAccount | null,
    );
    this.currentAccount$ = this.currentAccountInternal$.pipe(
      distinctUntilChanged(),
    );

    this.store = store;

    if (store.getWalletsSync != null) {
      this.initWithWallets(store.getWalletsSync());
    }
    this.initPromise = this.init();
  }

  public getCurrentAccount(): UserAccount | null {
    return this.currentAccountInternal$.getValue();
  }

  public getAccounts(): UserAccount[] {
    return this.accountsInternal$.getValue();
  }

  public get wallets(): Wallets {
    return this.walletsInternal$.getValue();
  }

  public get currentAccount(): UserAccount | null {
    return this.currentAccountInternal$.getValue();
  }

  public async sign({
    account,
    message,
    monitor,
  }: {
    account: UserAccountID;
    message: string;
    monitor?: Monitor;
  }): Promise<Witness> {
    await this.initPromise;

    return this.capture(
      async () => {
        const privateKey = this.getPrivateKey(account);
        const witness = crypto.createWitness(
          Buffer.from(message, 'hex'),
          common.stringToPrivateKey(privateKey),
        );

        return {
          verification: witness.verification.toString('hex'),
          invocation: witness.invocation.toString('hex'),
        };
      },
      'neo_sign',
      monitor,
    );
  }

  // eslint-disable-next-line
  public async selectAccount(
    id?: UserAccountID,
    monitor?: Monitor,
  ): Promise<void> {
    if (id == null) {
      this.currentAccountInternal$.next(null);
    } else {
      const { account } = this.getWallet(id);
      this.currentAccountInternal$.next(account);
    }
  }

  public async updateAccountName({
    id,
    name,
    monitor,
  }: UpdateAccountNameOptions): Promise<void> {
    return this.capture(
      async (span) => {
        await this.initPromise;

        const wallet = this.getWallet(id);
        let newWallet: Wallet;
        const account = {
          type: wallet.account.type,
          id: wallet.account.id,
          name,
          scriptHash: wallet.account.scriptHash,
          publicKey: wallet.account.publicKey,
          deletable: true,
          configurableName: true,
        };

        if (wallet.type === 'locked') {
          newWallet = {
            type: 'locked',
            account,
            nep2: wallet.nep2,
          };
        } else {
          newWallet = {
            type: 'unlocked',
            account,
            privateKey: wallet.privateKey,
            nep2: wallet.nep2,
          };
        }
        await this.capture(
          (innerSpan) => this.store.saveWallet(newWallet, innerSpan),
          'neo_save_wallet',
          span,
        );

        this.updateWallet(newWallet);
      },
      'neo_update_account_name',
      monitor,
    );
  }

  public getWallet({ address, network }: UserAccountID): Wallet {
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

  public getWallet$({
    address,
    network,
  }: UserAccountID): Observable<Wallet | null> {
    return this.walletsInternal$.pipe(
      map((wallets) => {
        const networkWallets = wallets[network];
        if (networkWallets == null) {
          return null;
        }

        return networkWallets[address];
      }),
    );
  }

  public async addAccount({
    network,
    privateKey: privateKeyIn,
    name,
    password,
    nep2: nep2In,
    monitor,
  }: {
    network: NetworkType;
    privateKey?: BufferString;
    name?: string;
    password?: string;
    nep2?: string;
    monitor?: Monitor;
  }): Promise<Wallet> {
    await this.initPromise;

    return this.capture(
      async (span) => {
        let privateKey = privateKeyIn;
        let nep2 = nep2In;
        if (privateKey == null) {
          if (nep2 == null || password == null) {
            throw new Error('Expected private key or password and NEP-2 key');
          }
          privateKey = await decryptNEP2({ encryptedKey: nep2, password });
        }

        const publicKey = privateKeyToPublicKey(privateKey);
        const scriptHash = publicKeyToScriptHash(publicKey);
        const address = scriptHashToAddress(scriptHash);

        if (nep2 == null && password != null) {
          nep2 = await encryptNEP2({ privateKey, password });
        }

        const account = {
          type: this.store.type,
          id: {
            network,
            address,
          },

          name: name == null ? address : name,
          scriptHash,
          publicKey,
          configurableName: true,
          deletable: true,
        };

        const unlockedWallet: UnlockedWallet = {
          type: 'unlocked',
          account,
          nep2,
          privateKey,
        };

        let wallet: Wallet = unlockedWallet;
        if (nep2 != null) {
          wallet = { type: 'locked', account, nep2 };
        }

        await this.capture(
          (innerSpan) => this.store.saveWallet(wallet, innerSpan),
          'neo_save_wallet',
          span,
        );

        this.updateWallet(unlockedWallet);

        if (this.currentAccount == null) {
          this.currentAccountInternal$.next(wallet.account);
        }

        return unlockedWallet;
      },
      'neo_add_account',
      monitor,
    );
  }

  public async deleteAccount(
    id: UserAccountID,
    monitor?: Monitor,
  ): Promise<void> {
    await this.initPromise;

    return this.capture(
      async (span) => {
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

        delete networkWallets[id.address];

        await this.capture(
          (innerSpan) => this.store.deleteWallet(wallet, innerSpan),
          'neo_delete_wallet',
          span,
        );

        this.walletsInternal$.next({
          ...wallets,
          [id.network]: networkWallets,
        });

        if (
          this.currentAccount != null &&
          this.currentAccount.id.network === id.network &&
          this.currentAccount.id.address === id.address
        ) {
          this.newCurrentAccount();
        }
      },
      'neo_delete_account',
      monitor,
    );
  }

  public async unlockWallet({
    id,
    password,
    monitor,
  }: {
    id: UserAccountID;
    password: string;
    monitor?: Monitor;
  }): Promise<void> {
    await this.initPromise;

    return this.capture(
      async () => {
        const wallet = this.getWallet(id);
        if (wallet.type === 'unlocked') {
          return;
        }

        if (wallet.nep2 == null) {
          throw new Error(
            'Unexpected error, privateKey and NEP2 were both null.',
          );
        }

        const privateKey = await decryptNEP2({
          encryptedKey: wallet.nep2,
          password,
        });

        this.updateWallet({
          type: 'unlocked',
          account: wallet.account,
          privateKey,
          nep2: wallet.nep2,
        });
      },
      'neo_unlock_wallet',
      monitor,
    );
  }

  public async lockWallet(id: UserAccountID): Promise<void> {
    await this.initPromise;

    const wallet = this.getWallet(id);
    if (wallet.type === 'locked' || wallet.nep2 == null) {
      return;
    }

    this.updateWallet({
      type: 'locked',
      account: wallet.account,
      nep2: wallet.nep2,
    });
  }

  private async init(): Promise<void> {
    const walletsList = await this.store.getWallets();
    this.initWithWallets(walletsList);
  }

  private initWithWallets(walletsList: Wallet[]): void {
    const wallets = walletsList.reduce((acc: Wallets, wallet) => {
      if (acc[wallet.account.id.network] == null) {
        acc[wallet.account.id.network] = {};
      }
      acc[wallet.account.id.network][wallet.account.id.address] = wallet;
      return acc;
    }, {});
    this.walletsInternal$.next(wallets);
    this.newCurrentAccount();
  }

  private getPrivateKey(id: UserAccountID): BufferString {
    const wallet = this.getWallet({
      network: id.network,
      address: id.address,
    });

    if (wallet.type === 'locked') {
      throw new LockedAccountError(id.address);
    }

    return wallet.privateKey;
  }

  private updateWallet(wallet: Wallet): void {
    const { wallets } = this;
    this.walletsInternal$.next({
      ...wallets,
      [wallet.account.id.network]: {
        ...(wallets[wallet.account.id.network] || {}),
        [wallet.account.id.address]: wallet,
      },
    });
  }

  private newCurrentAccount(): void {
    const allAccounts = flattenWallets(this.wallets).map(
      ({ account: value }) => value,
    );

    const account = allAccounts[0];
    this.currentAccountInternal$.next(account);
  }

  private capture<T>(
    func: (monitor?: Monitor) => Promise<T>,
    name: string,
    monitor?: Monitor,
  ): Promise<T> {
    if (monitor == null) {
      return func();
    }

    return monitor.at('local_key_store').captureSpanLog(func, {
      name,
      level: { log: 'verbose', span: 'info' },
      trace: true,
    });
  }
}
