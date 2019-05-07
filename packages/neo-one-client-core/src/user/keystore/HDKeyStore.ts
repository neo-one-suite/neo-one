import { Account, AddressString, NetworkType, UserAccount, UserAccountID } from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import { mergeScanLatest, utils } from '@neo-one/utils';
import _ from 'lodash';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { UnknownAccountError, UnknownNetworkError } from '../../errors';
import { KeyStore } from '../LocalUserAccountProvider';

export interface HDAccount<Identifier> {
  readonly identifier: Identifier;
  readonly userAccount: UserAccount;
}

type HDAccounts<Identifier> = {
  readonly [Network in string]?: { readonly [Address in string]?: HDAccount<Identifier> };
};

export interface HDProvider {
  readonly getAccount: (network: NetworkType, address: AddressString, monitor?: Monitor) => Promise<Account>;
  readonly getNetworks: () => readonly NetworkType[];
  readonly networks$: Observable<readonly NetworkType[]>;
}

export interface HDHandler<Identifier> {
  readonly byteLimit?: number;
  readonly scanAccounts: (network: NetworkType, maxOffset?: number) => Promise<ReadonlyArray<HDAccount<Identifier>>>;
  readonly sign: (options: { readonly message: Buffer; readonly account: Identifier }) => Promise<Buffer>;
  readonly close: () => Promise<void>;
}

interface HDScanInterface<Identifier> {
  readonly accounts: HDAccounts<Identifier>;
  readonly scannedNetworks: Set<NetworkType>;
}

const flattenAccounts = <Identifier>(accounts: HDAccounts<Identifier>) =>
  _.flatten(
    Object.values(accounts)
      .filter(utils.notNull)
      .map((networkAccounts) => Object.values(networkAccounts)),
  ).filter(utils.notNull);

const getNewNetworks = (networks: Set<NetworkType> | undefined, networksIn: readonly NetworkType[]) => {
  if (networks === undefined) {
    return networksIn;
  }

  return networksIn.filter((network) => !networks.has(network));
};

export class HDKeyStore<Identifier> implements KeyStore {
  public readonly byteLimit?: number;
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  public readonly userAccounts$: Observable<readonly UserAccount[]>;

  private readonly provider: HDProvider;
  private readonly handler: HDHandler<Identifier>;
  private readonly accountsSubscription: Subscription;

  private readonly currentUserAccountInternal$: BehaviorSubject<UserAccount | undefined>;
  private readonly userAccountsInternal$: BehaviorSubject<readonly UserAccount[]>;
  private readonly accountsInternal$: BehaviorSubject<HDAccounts<Identifier>>;
  private readonly accounts$: Observable<ReadonlyArray<HDAccount<Identifier>>>;

  public constructor(provider: HDProvider, handler: HDHandler<Identifier>) {
    this.provider = provider;
    this.handler = handler;

    this.byteLimit = handler.byteLimit;

    this.accountsInternal$ = new BehaviorSubject<HDAccounts<Identifier>>({});
    this.accountsSubscription = this.provider.networks$
      .pipe(
        mergeScanLatest(async (acc: HDScanInterface<Identifier> | undefined, networks) => {
          const networksFiltered = getNewNetworks(acc === undefined ? undefined : acc.scannedNetworks, networks);
          const next = await Promise.all(
            networksFiltered.map(async (network) => this.handler.scanAccounts(network, 5)),
          );
          const newAccounts = next.reduce<ReadonlyArray<HDAccount<Identifier>>>(
            (accum, newAccountsIn) => accum.concat(newAccountsIn),
            [],
          );

          const nextAccounts = newAccounts.reduce<HDAccounts<Identifier>>(
            (accum, account) => ({
              ...accum,
              [account.userAccount.id.network]: {
                ...(accum[account.userAccount.id.network] === undefined ? {} : accum[account.userAccount.id.network]),
                [account.userAccount.id.address]: account,
              },
            }),
            acc === undefined ? {} : acc.accounts,
          );

          return {
            accounts: nextAccounts,
            scannedNetworks:
              acc === undefined
                ? new Set<NetworkType>()
                : new Set<NetworkType>([...acc.scannedNetworks].concat(networksFiltered)),
          };
        }),
        map(({ accounts }) => accounts),
      )
      .subscribe(this.accountsInternal$);

    this.accounts$ = this.accountsInternal$.pipe(
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
      map(flattenAccounts),
    );

    this.userAccountsInternal$ = new BehaviorSubject<readonly UserAccount[]>([]);
    this.accounts$
      .pipe(map((accounts) => accounts.map(({ userAccount }) => userAccount)))
      .subscribe(this.userAccountsInternal$);
    this.userAccounts$ = this.userAccountsInternal$;

    this.currentUserAccountInternal$ = new BehaviorSubject<UserAccount | undefined>(undefined);
    this.accounts$
      .pipe(
        map((accounts) => {
          if (accounts.length === 0) {
            return undefined;
          }

          return accounts[0].userAccount;
        }),
      )
      .subscribe(this.currentUserAccountInternal$);
    this.currentUserAccount$ = this.currentUserAccountInternal$.pipe(distinctUntilChanged());
  }

  public getCurrentUserAccount(): UserAccount | undefined {
    return this.currentUserAccountInternal$.getValue();
  }

  public getUserAccounts(): readonly UserAccount[] {
    return this.userAccountsInternal$.getValue();
  }

  public getNetworks(): readonly NetworkType[] {
    return this.provider.getNetworks();
  }

  public async selectUserAccount(id?: UserAccountID, _monitor?: Monitor): Promise<void> {
    if (id === undefined) {
      this.currentUserAccountInternal$.next(undefined);
    } else {
      const { userAccount } = this.getHDAccount(id);
      this.currentUserAccountInternal$.next(userAccount);
    }
  }

  public async sign({
    account,
    message,
    monitor,
  }: {
    readonly account: UserAccountID;
    readonly message: string;
    readonly monitor?: Monitor;
  }): Promise<string> {
    return this.capture(
      async () => {
        const hdAccount = this.getHDAccount(account);
        const response = await this.handler.sign({
          message: Buffer.from(message, 'hex'),
          account: hdAccount.identifier,
        });

        return response.toString('hex');
      },
      'neo_sign',
      monitor,
    );
  }

  public async close(): Promise<void> {
    this.accountsSubscription.unsubscribe();

    await this.handler.close();
  }

  private get accounts(): HDAccounts<Identifier> {
    return this.accountsInternal$.getValue();
  }

  private getHDAccount({ address, network }: UserAccountID): HDAccount<Identifier> {
    const accounts = this.accounts[network];
    if (accounts === undefined) {
      throw new UnknownNetworkError(network);
    }

    const account = accounts[address];
    if (account === undefined) {
      throw new UnknownAccountError(address);
    }

    return account;
  }

  private async capture<T>(func: (monitor?: Monitor) => Promise<T>, name: string, monitor?: Monitor): Promise<T> {
    if (monitor === undefined) {
      return func();
    }

    return monitor.at('hd_key_store').captureSpanLog(func, {
      name,
      level: { log: 'verbose', span: 'info' },
      trace: true,
    });
  }
}
