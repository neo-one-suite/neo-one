import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import * as argAssertions from './args';
import { UnknownAccountError, UnknownNetworkError } from './errors';
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
  public readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  protected readonly providers$: BehaviorSubject<TUserAccountProviders>;
  protected readonly selectedProvider$: BehaviorSubject<UserAccountProvider>;

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
    return this.providers$.value;
  }

  public getAccount(id: UserAccountID): UserAccount {
    argAssertions.assertUserAccountID(id);
    const provider = this.getProvider({ from: id });
    const account = provider
      .getAccounts()
      .find((acct) => acct.id.network === id.network && acct.id.address === id.address);

    if (account === undefined) {
      throw new UnknownAccountError(id.address);
    }

    return account;
  }

  public async selectAccount(id?: UserAccountID): Promise<void> {
    argAssertions.assertUserAccountID(id);
    const provider = this.getProvider({ from: id });
    await provider.selectAccount(id);
    this.selectedProvider$.next(provider);
  }

  public async deleteAccount(id: UserAccountID): Promise<void> {
    argAssertions.assertUserAccountID(id);
    await this.getProvider({ from: id }).deleteAccount(id);
  }

  public async updateAccountName({ id, name }: UpdateAccountNameOptions): Promise<void> {
    argAssertions.assertUpdateAccountNameOptions({ id, name });
    await this.getProvider({ from: id }).updateAccountName({ id, name });
  }

  public getCurrentAccount(): UserAccount | undefined {
    return this.selectedProvider$.value.getCurrentAccount();
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
      return this.selectedProvider$.value;
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
      provider.getAccounts().some((account) => account.id.network === network),
    );

    if (accountProvider === undefined) {
      throw new UnknownNetworkError(network);
    }

    return accountProvider;
  }
}
