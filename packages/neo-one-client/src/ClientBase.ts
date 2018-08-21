import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, take } from 'rxjs/operators';
import * as args from './args';
import { UnknownAccountError, UnknownNetworkError } from './errors';
import * as networksConstant from './networks';
import {
  InvokeTransactionOptions,
  NetworkType,
  TransactionOptions,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
} from './types';

export class ClientBase<TUserAccountProviders extends { readonly [K in string]: UserAccountProvider }> {
  public readonly currentAccount$: Observable<UserAccount | undefined>;
  public readonly accounts$: Observable<ReadonlyArray<UserAccount>>;
  public readonly currentNetwork$: Observable<NetworkType>;
  public readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  protected readonly providers$: BehaviorSubject<TUserAccountProviders>;
  protected readonly selectedProvider$: BehaviorSubject<UserAccountProvider>;
  private readonly currentNetworkInternal$: BehaviorSubject<NetworkType>;

  public constructor(providersIn: TUserAccountProviders) {
    const providersArray = Object.values(providersIn);
    const providerIn =
      providersArray.find((provider) => provider.getCurrentAccount() !== undefined) ||
      (providersArray[0] as UserAccountProvider | undefined);
    if (providerIn === undefined) {
      throw new Error('At least one provider is required');
    }

    if (Object.entries(providersIn).some(([type, provider]) => type !== provider.type)) {
      throw new Error('Provider keys must be named the same as their type');
    }

    this.providers$ = new BehaviorSubject(providersIn);
    this.selectedProvider$ = new BehaviorSubject(providerIn);

    this.currentAccount$ = this.selectedProvider$.pipe(switchMap((provider) => provider.currentAccount$));

    this.accounts$ = this.providers$.pipe(
      switchMap((providers) => combineLatest(Object.values(providers).map((provider) => provider.accounts$))),
      map((accountss) => accountss.reduce((acc, accounts) => acc.concat(accounts), [])),
    );

    this.networks$ = this.providers$.pipe(
      switchMap((providers) => combineLatest(Object.values(providers).map((provider) => provider.networks$))),
      map((networkss) => [...new Set(networkss.reduce((acc, networks) => acc.concat(networks), []))]),
    );

    this.currentNetworkInternal$ = new BehaviorSubject(providerIn.getNetworks()[0]);
    combineLatest(this.currentAccount$, this.selectedProvider$)
      .pipe(
        map(([currentAccount, provider]) => {
          if (currentAccount !== undefined) {
            return currentAccount.id.network;
          }

          const mainNetwork = provider.getNetworks().find((network) => network === networksConstant.MAIN);

          return mainNetwork === undefined ? provider.getNetworks()[0] : mainNetwork;
        }),
      )
      .subscribe(this.currentNetworkInternal$);
    this.currentNetwork$ = this.currentNetworkInternal$.pipe(distinctUntilChanged());

    if (this.getCurrentAccount() === undefined) {
      this.accounts$
        .pipe(
          filter((accounts) => accounts.length > 0),
          take(1),
        )
        .toPromise()
        .then(async (accounts) => {
          const account = accounts[0] as UserAccount | undefined;
          if (this.getCurrentAccount() === undefined && account !== undefined) {
            await this.selectAccount(account.id);
          }
        })
        .catch(() => {
          // Just ignore errors here.
        });
    }
  }

  public get providers(): TUserAccountProviders {
    return this.providers$.getValue();
  }

  public getAccount(idIn: UserAccountID): UserAccount {
    const id = args.assertUserAccountID('id', idIn);
    const provider = this.getProvider({ from: id });
    const account = provider
      .getAccounts()
      .find((acct) => acct.id.network === id.network && acct.id.address === id.address);

    if (account === undefined) {
      /* istanbul ignore next */
      throw new UnknownAccountError(id.address);
    }

    return account;
  }

  public async selectAccount(idIn?: UserAccountID): Promise<void> {
    const id = args.assertNullableUserAccountID('id', idIn);
    const provider = this.getProvider({ from: id });
    await provider.selectAccount(id);
    this.selectedProvider$.next(provider);
  }

  public async selectNetwork(networkIn: NetworkType): Promise<void> {
    const network = args.assertString('network', networkIn);
    const provider = this.getNetworkProvider(network);
    const account = provider.getCurrentAccount();
    if (account === undefined) {
      const accounts = provider.getAccounts();
      if (accounts.length > 0) {
        await provider.selectAccount(accounts[0].id);
      }
    }
    this.selectedProvider$.next(provider);
  }

  public async deleteAccount(idIn: UserAccountID): Promise<void> {
    const id = args.assertUserAccountID('id', idIn);
    await this.getProvider({ from: id }).deleteAccount(id);
  }

  public async updateAccountName(options: UpdateAccountNameOptions): Promise<void> {
    const { id, name } = args.assertUpdateAccountNameOptions('options', options);
    await this.getProvider({ from: id }).updateAccountName({ id, name });
  }

  public getCurrentAccount(): UserAccount | undefined {
    return this.selectedProvider$.getValue().getCurrentAccount();
  }

  public getCurrentNetwork(): NetworkType {
    return this.currentNetworkInternal$.getValue();
  }

  public getAccounts(): ReadonlyArray<UserAccount> {
    return Object.values(this.providers).reduce(
      (acc: UserAccount[], provider) => acc.concat(provider.getAccounts()),
      [],
    );
  }

  public getNetworks(): ReadonlyArray<NetworkType> {
    const providers = Object.values(this.providers);

    return [...new Set(providers.reduce((acc: NetworkType[], provider) => acc.concat(provider.getNetworks()), []))];
  }

  protected getProvider(options: TransactionOptions | InvokeTransactionOptions = {}): UserAccountProvider {
    const { from } = options;
    if (from === undefined) {
      return this.selectedProvider$.getValue();
    }

    const providers = Object.values(this.providers);
    const accountProvider = providers.find((provider) =>
      provider
        .getAccounts()
        .some((account) => account.id.network === from.network && account.id.address === from.address),
    );

    if (accountProvider === undefined) {
      throw new UnknownAccountError(from.address);
    }

    return accountProvider;
  }

  protected getNetworkProvider(network: NetworkType): UserAccountProvider {
    const providers = Object.values(this.providers);
    const accountProvider = providers.find((provider) =>
      provider.getNetworks().some((providerNetwork) => providerNetwork === network),
    );

    if (accountProvider === undefined) {
      throw new UnknownNetworkError(network);
    }

    return accountProvider;
  }
}
