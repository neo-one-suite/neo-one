import {
  AccountContract,
  BufferString,
  common,
  crypto,
  decryptNEP2,
  encryptNEP2,
  NetworkType,
  PrivateKeyString,
  privateKeyToPublicKey,
  publicKeyToAddress,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
} from '@neo-one/client-common';
import { utils } from '@neo-one/utils';
import debug from 'debug';
import _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import * as args from '../../args';
import { LockedAccountError, UnknownAccountError } from '../../errors';
import { KeyStore } from '../LocalUserAccountProvider';

const logger = debug('NEOONE:LocalKeystore');

/**
 * Wallet in the "locked" state.
 */
export interface LockedWallet {
  /**
   * `type` differentiates a `LockedWallet` from other `LocalWallet`s, i.e. an `UnlockedWallet`
   */
  readonly type: 'locked';
  /**
   * `UserAccount` this `LockedWallet` refers to.
   */
  readonly userAccount: UserAccount;
  /**
   * NEP-2 encrypted key of this `LockedWallet`.
   */
  readonly nep2: string;
}

/**
 * Wallet in the "unlocked" state.
 */
export interface UnlockedWallet {
  /**
   * `type` differentiates an `UnlockedWallet` from other `LocalWallet`s, i.e. an `LockedWallet`
   */
  readonly type: 'unlocked';
  /**
   * `UserAccount` this `UnlockedWallet` refers to.
   */
  readonly userAccount: UserAccount;
  /**
   * Private key for this `UnlockedWallet`.
   */
  readonly privateKey: PrivateKeyString;
  /**
   * NEP-2 encrypted key of this `UnlockedWallet`. `undefined` if the `privateKey` has never been encrypted.
   */
  readonly nep2?: string | undefined;
}

/**
 * Locally stored wallet that is either in a `'locked'` or `'unlocked'` state (`type`).
 */
export type LocalWallet = LockedWallet | UnlockedWallet;
/**
 * Mapping from `NetworkType` -> `AddressString` -> `LocalWallet`
 */
export type Wallets = { readonly [Network in string]?: { readonly [Address in string]?: LocalWallet } };

/**
 * Base interface that must be implemented to use the `LocalKeyStore`.
 */
export interface LocalStore {
  /**
   * @returns `Promise` that resolves to all available `LocalWallet`s.
   */
  readonly getWallets: () => Promise<readonly LocalWallet[]>;
  /**
   * Optional method that returns the available wallets synchronously.
   *
   * @returns All available `LocalWallet`s
   */
  readonly getWalletsSync?: () => readonly LocalWallet[];
  /**
   * Save a wallet to the store.
   */
  readonly saveWallet: (wallet: LocalWallet) => Promise<void>;
  /**
   * Delete a wallet from the store.
   */
  readonly deleteWallet: (account: LocalWallet) => Promise<void>;
}

const flattenWallets = (wallets: Wallets) =>
  _.flatten(
    Object.values(wallets)
      .filter(utils.notNull)
      .map((networkWallets) => Object.values(networkWallets)),
  ).filter(utils.notNull);

/**
 * `LocalKeyStore` implements the `KeyStore` interface expected by `LocalUserAccountProvider` via an underlying `Store` implementation.
 */
export class LocalKeyStore implements KeyStore {
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  public readonly userAccounts$: Observable<readonly UserAccount[]>;
  public readonly wallets$: Observable<readonly LocalWallet[]>;
  private readonly currentAccountInternal$: BehaviorSubject<UserAccount | undefined>;
  private readonly accountsInternal$: BehaviorSubject<readonly UserAccount[]>;
  private readonly walletsInternal$: BehaviorSubject<Wallets>;
  private readonly store: LocalStore;
  private readonly initPromise: Promise<void>;

  public constructor(store: LocalStore) {
    this.walletsInternal$ = new BehaviorSubject<Wallets>({});
    this.wallets$ = this.walletsInternal$.pipe(
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
      map(flattenWallets),
    );

    this.accountsInternal$ = new BehaviorSubject([] as readonly UserAccount[]);
    this.wallets$
      .pipe(map((wallets) => wallets.map(({ userAccount }) => userAccount)))
      .subscribe(this.accountsInternal$);
    this.userAccounts$ = this.accountsInternal$;

    this.currentAccountInternal$ = new BehaviorSubject(undefined as UserAccount | undefined);
    this.currentUserAccount$ = this.currentAccountInternal$.pipe(distinctUntilChanged());

    this.store = store;

    if (store.getWalletsSync !== undefined) {
      this.initWithWallets(store.getWalletsSync());
    }
    this.initPromise = this.init();
  }

  public getCurrentUserAccount(): UserAccount | undefined {
    return this.currentAccountInternal$.getValue();
  }

  public getUserAccounts(): readonly UserAccount[] {
    return this.accountsInternal$.getValue();
  }

  public get wallets(): readonly LocalWallet[] {
    return flattenWallets(this.walletsObj);
  }

  public async sign({
    account,
    message,
  }: {
    readonly account: UserAccountID;
    readonly message: string;
  }): Promise<string> {
    await this.initPromise;

    return this.capture(async () => {
      const privateKey = this.getPrivateKey(account);

      return crypto
        .sign({ message: Buffer.from(message, 'hex'), privateKey: common.stringToPrivateKey(privateKey) })
        .toString('hex');
    }, 'neo_sign');
  }

  public async selectUserAccount(id?: UserAccountID): Promise<void> {
    if (id === undefined) {
      this.currentAccountInternal$.next(undefined);
      this.newCurrentAccount();
    } else {
      const { userAccount } = this.getWallet(id);
      this.currentAccountInternal$.next(userAccount);
    }
  }

  public async updateUserAccountName({ id, name }: UpdateAccountNameOptions): Promise<void> {
    return this.capture(async () => {
      await this.initPromise;

      const wallet = this.getWallet(id);
      let newWallet: LocalWallet;
      const userAccount = {
        id: wallet.userAccount.id,
        name,
        publicKey: wallet.userAccount.publicKey,
        contract: wallet.userAccount.contract,
      };

      if (wallet.type === 'locked') {
        newWallet = {
          type: 'locked',
          userAccount,
          nep2: wallet.nep2,
        };
      } else {
        newWallet = {
          type: 'unlocked',
          userAccount,
          privateKey: wallet.privateKey,
          nep2: wallet.nep2,
        };
      }
      await this.capture(async () => this.store.saveWallet(newWallet), 'neo_save_wallet');

      this.updateWallet(newWallet);
    }, 'neo_update_account_name');
  }

  public getWallet({ address, network }: UserAccountID): LocalWallet {
    const wallets = this.walletsObj[network];
    if (wallets === undefined) {
      throw new UnknownAccountError(address);
    }

    const wallet = wallets[address];
    if (wallet === undefined) {
      throw new UnknownAccountError(address);
    }

    return wallet;
  }

  public getWallet$({ address, network }: UserAccountID): Observable<LocalWallet | undefined> {
    return this.walletsInternal$.pipe(
      map((wallets) => {
        const networkWallets = wallets[network];
        if (networkWallets === undefined) {
          return undefined;
        }

        return networkWallets[address];
      }),
    );
  }

  public async addUserAccount({
    network,
    privateKey: privateKeyIn,
    name,
    password,
    nep2: nep2In,
  }: {
    readonly network: NetworkType;
    readonly privateKey?: BufferString;
    readonly name?: string;
    readonly password?: string;
    readonly nep2?: string;
  }): Promise<LocalWallet> {
    await this.initPromise;

    return this.capture(async () => {
      let pk = privateKeyIn;
      let nep2 = nep2In;
      if (pk === undefined) {
        if (nep2 === undefined || password === undefined) {
          throw new Error('Expected private key or password and NEP-2 key');
        }
        pk = await decryptNEP2({ encryptedKey: nep2, password });
      }

      const privateKey = args.assertPrivateKey('privateKey', pk);
      const publicKey = privateKeyToPublicKey(privateKey);
      const address = publicKeyToAddress(publicKey);

      if (nep2 === undefined && password !== undefined) {
        nep2 = await encryptNEP2({ privateKey, password });
      }

      const contract = AccountContract.createSignatureContract(common.stringToECPoint(publicKey));

      const userAccount = {
        id: {
          network,
          address,
        },
        name: name === undefined ? address : name,
        publicKey,
        contract,
      };

      const unlockedWallet: UnlockedWallet = {
        type: 'unlocked',
        userAccount,
        nep2,
        privateKey,
      };

      let wallet: LocalWallet = unlockedWallet;
      if (nep2 !== undefined) {
        wallet = { type: 'locked', userAccount, nep2 };
      }

      await this.capture(async () => this.store.saveWallet(wallet), 'neo_save_wallet');

      this.updateWallet(unlockedWallet);

      if (this.currentAccount === undefined) {
        this.currentAccountInternal$.next(wallet.userAccount);
      }

      return unlockedWallet;
    }, 'neo_add_account');
  }

  /**
   * not a true implementation, just serves as a helper for private net.
   * @internal
   */
  public async addMultiSigUserAccount({
    network,
    privateKeys: privateKeysIn,
    name,
  }: {
    readonly network: NetworkType;
    readonly privateKeys: readonly BufferString[];
    readonly name?: string;
  }): Promise<LocalWallet> {
    await this.initPromise;

    return this.capture(async () => {
      const pk = privateKeysIn[0];

      const privateKey = args.assertPrivateKey('privateKey', pk);
      const publicKey = privateKeyToPublicKey(privateKey);
      const ecPoint = common.stringToECPoint(publicKey);
      const address = crypto.scriptHashToAddress({
        addressVersion: common.NEO_ADDRESS_VERSION,
        scriptHash: crypto.toScriptHash(crypto.createMultiSignatureVerificationScript(1, [ecPoint])),
      });

      const contract = AccountContract.createMultiSigContract(1, [ecPoint]);

      const userAccount = {
        id: {
          network,
          address,
        },
        name: name === undefined ? address : name,
        publicKey,
        contract,
      };

      const unlockedWallet: UnlockedWallet = {
        type: 'unlocked',
        userAccount,
        privateKey,
      };

      const wallet: LocalWallet = unlockedWallet;

      await this.capture(async () => this.store.saveWallet(wallet), 'neo_save_wallet');

      this.updateWallet(unlockedWallet);

      if (this.currentAccount === undefined) {
        this.currentAccountInternal$.next(wallet.userAccount);
      }

      return unlockedWallet;
    }, 'neo_add_account');
  }

  public async deleteUserAccount(id: UserAccountID): Promise<void> {
    await this.initPromise;

    return this.capture(async () => {
      const { walletsObj: wallets } = this;
      const networkWalletsIn = wallets[id.network];
      if (networkWalletsIn === undefined) {
        return;
      }

      const { [id.address]: wallet, ...networkWallets } = networkWalletsIn;
      if (wallet === undefined) {
        return;
      }

      await this.capture(async () => this.store.deleteWallet(wallet), 'neo_delete_wallet');

      this.walletsInternal$.next({
        ...wallets,
        [id.network]: networkWallets,
      });

      if (
        this.currentAccount !== undefined &&
        this.currentAccount.id.network === id.network &&
        this.currentAccount.id.address === id.address
      ) {
        this.newCurrentAccount();
      }
    }, 'neo_delete_account');
  }

  public async unlockWallet({
    id,
    password,
  }: {
    readonly id: UserAccountID;
    readonly password: string;
  }): Promise<void> {
    await this.initPromise;

    return this.capture(async () => {
      const wallet = this.getWallet(id);
      if (wallet.type === 'unlocked') {
        return;
      }

      const privateKey = await decryptNEP2({
        encryptedKey: wallet.nep2,
        password,
      });

      this.updateWallet({
        type: 'unlocked',
        userAccount: wallet.userAccount,
        privateKey,
        nep2: wallet.nep2,
      });
    }, 'neo_unlock_wallet');
  }

  public async lockWallet(id: UserAccountID): Promise<void> {
    await this.initPromise;

    const wallet = this.getWallet(id);
    if (wallet.type === 'locked' || wallet.nep2 === undefined) {
      return;
    }

    this.updateWallet({
      type: 'locked',
      userAccount: wallet.userAccount,
      nep2: wallet.nep2,
    });
  }

  private async init(): Promise<void> {
    const walletsList = await this.store.getWallets();
    this.initWithWallets(walletsList);
  }

  private initWithWallets(walletsList: readonly LocalWallet[]): void {
    const wallets = walletsList.reduce<Wallets>(
      (acc, wallet) => ({
        ...acc,
        [wallet.userAccount.id.network]: {
          ...(acc[wallet.userAccount.id.network] === undefined ? {} : acc[wallet.userAccount.id.network]),
          [wallet.userAccount.id.address]: wallet,
        },
      }),
      {},
    );
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

  private updateWallet(wallet: LocalWallet): void {
    const { walletsObj: wallets } = this;
    this.walletsInternal$.next({
      ...wallets,
      [wallet.userAccount.id.network]: {
        ...(wallets[wallet.userAccount.id.network] === undefined ? {} : wallets[wallet.userAccount.id.network]),
        [wallet.userAccount.id.address]: wallet,
      },
    });
  }

  private newCurrentAccount(): void {
    const allAccounts = this.wallets.map(({ userAccount: value }) => value);

    const account = allAccounts[0];
    this.currentAccountInternal$.next(account);
  }

  private async capture<T>(func: () => Promise<T>, title: string): Promise<T> {
    try {
      const result = await func();
      logger('%o', { title, level: 'debug' });

      return result;
    } catch (error) {
      logger('%o', { title, level: 'error', error: error.message });
      throw error;
    }
  }

  private get walletsObj(): Wallets {
    return this.walletsInternal$.getValue();
  }

  private get currentAccount(): UserAccount | undefined {
    return this.currentAccountInternal$.getValue();
  }
}
