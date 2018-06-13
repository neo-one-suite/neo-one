import { Param as ScriptBuilderParam } from '@neo-one/client-core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import * as argAssertions from './args';
import { UnknownAccountError, UnknownNetworkError } from './errors';
import { ReadClient } from './ReadClient';
import { createSmartContract } from './sc';
import {
  AssetRegister,
  ContractRegister,
  Hash160String,
  InvokeReceiptInternal,
  InvokeTransactionOptions,
  NetworkType,
  Param,
  PublishReceipt,
  RawInvocationResult,
  RegisterAssetReceipt,
  SmartContract,
  SmartContractDefinition,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
} from './types';

const clients: Array<Client<any>> = [];

export class Client<
  TUserAccountProviders extends { [key: string]: UserAccountProvider }
> {
  public static inject(provider: UserAccountProvider): void {
    clients.forEach((client) => client.inject(provider));
  }

  public readonly currentAccount$: Observable<UserAccount | null>;
  public readonly accounts$: Observable<UserAccount[]>;
  public readonly networks$: Observable<NetworkType[]>;
  private readonly providers$: BehaviorSubject<TUserAccountProviders>;
  private readonly selectedProvider$: BehaviorSubject<UserAccountProvider>;

  constructor(providersIn: TUserAccountProviders) {
    const providersArray = Object.values(providersIn);
    const providerIn =
      providersArray.find((provider) => provider.getCurrentAccount() != null) ||
      providersArray[0];
    if (providerIn == null) {
      throw new Error('At least one provider is required');
    }

    if (
      Object.entries(providersIn).some(
        ([type, provider]) => type !== provider.type,
      )
    ) {
      throw new Error('Provider keys must be named the same as their type');
    }

    this.providers$ = new BehaviorSubject(providersIn);
    this.selectedProvider$ = new BehaviorSubject(providerIn);

    this.currentAccount$ = this.selectedProvider$.pipe(
      switchMap((provider) => provider.currentAccount$),
    );

    this.accounts$ = this.providers$.pipe(
      switchMap((providers) =>
        combineLatest(
          Object.values(providers).map((provider) => provider.accounts$),
        ),
      ),

      map((accountss) =>
        accountss.reduce((acc, accounts) => acc.concat(accounts), []),
      ),
    );

    this.networks$ = this.providers$.pipe(
      switchMap((providers) =>
        combineLatest(
          Object.values(providers).map((provider) => provider.networks$),
        ),
      ),

      map((networkss) => [
        ...new Set(
          networkss.reduce((acc, networks) => acc.concat(networks), []),
        ),
      ]),
    );

    clients.push(this);

    if (this.getCurrentAccount() == null) {
      this.accounts$
        .pipe(
          filter((accounts) => accounts.length > 0),
          take(1),
        )
        .toPromise()
        .then(async (accounts) => {
          const account = accounts[0];
          if (this.getCurrentAccount() == null && account != null) {
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
    const provider = this.getProvider({ from: id });
    const account = provider
      .getAccounts()
      .find(
        (acct) =>
          acct.id.network === id.network && acct.id.address === id.address,
      );

    /* istanbul ignore if  */
    if (account == null) {
      throw new UnknownAccountError(id.address);
    }

    return account;
  }

  public async selectAccount(id?: UserAccountID): Promise<void> {
    const provider = this.getProvider({ from: id });
    await provider.selectAccount(id);
    this.selectedProvider$.next(provider);
  }

  public async deleteAccount(id: UserAccountID): Promise<void> {
    await this.getProvider({ from: id }).deleteAccount(id);
  }

  public async updateAccountName({
    id,
    name,
  }: UpdateAccountNameOptions): Promise<void> {
    await this.getProvider({ from: id }).updateAccountName({ id, name });
  }

  public getCurrentAccount(): UserAccount | null {
    return this.selectedProvider$.value.getCurrentAccount();
  }

  public getAccounts(): UserAccount[] {
    return Object.values(this.providers).reduce(
      (acc: UserAccount[], provider) => acc.concat(provider.getAccounts()),
      [],
    );
  }

  public getNetworks(): NetworkType[] {
    const providers = Object.values(this.providers);
    return [
      ...new Set(
        providers.reduce(
          (acc: NetworkType[], provider) => acc.concat(provider.getNetworks()),
          [],
        ),
      ),
    ];
  }

  public transfer(
    ...args: any[]
  ): Promise<TransactionResult<TransactionReceipt>> {
    const { transfers, options } = this.getTransfersOptions(args);

    return this.getProvider(options).transfer(transfers, options);
  }

  public claim(
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>> {
    argAssertions.assertTransactionOptions(options);
    return this.getProvider(options).claim(options);
  }

  public publish(
    contract: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    argAssertions.assertTransactionOptions(options);
    return this.getProvider(options).publish(contract, options);
  }

  public registerAsset(
    asset: AssetRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt>> {
    return this.getProvider(options).registerAsset(asset, options);
  }

  public issue(...args: any[]): Promise<TransactionResult<TransactionReceipt>> {
    const { transfers, options } = this.getTransfersOptions(args);
    return this.getProvider(options).issue(transfers, options);
  }

  public read(network: NetworkType): ReadClient<any> {
    return new ReadClient(this.getNetworkProvider(network).read(network));
  }

  public smartContract(definition: SmartContractDefinition): SmartContract {
    return createSmartContract({ definition, client: this });
  }

  public inject<K>(
    provider: K extends keyof TUserAccountProviders
      ? TUserAccountProviders[K]
      : UserAccountProvider,
  ): void {
    this.providers$.next(
      Object.assign({}, this.providers, {
        [provider.type]: provider,
      }),
    );

    this.selectedProvider$.next(provider);
  }

  /* internal */
  public invoke(
    contract: Hash160String,
    method: string,
    params: Array<ScriptBuilderParam | null>,
    paramsZipped: Array<[string, Param | null]>,
    verify: boolean,
    options?: InvokeTransactionOptions,
  ): Promise<TransactionResult<InvokeReceiptInternal>> {
    return this.getProvider(options).invoke(
      contract,
      method,
      params,
      paramsZipped,
      verify,
      options,
    );
  }

  public call(
    contract: Hash160String,
    method: string,
    params: Array<ScriptBuilderParam | null>,
    options?: TransactionOptions,
  ): Promise<RawInvocationResult> {
    return this.getProvider(options).call(contract, method, params, options);
  }

  private getTransfersOptions(
    args: any[],
  ): {
    transfers: Transfer[];
    options?: TransactionOptions;
  } {
    let transfers = [];
    let options;
    if (args.length >= 3) {
      transfers.push({
        amount: args[0],
        asset: args[1],
        to: args[2],
      });

      // eslint-disable-next-line
      options = args[3];
    } else {
      // eslint-disable-next-line
      transfers = args[0];
      // eslint-disable-next-line
      options = args[1];
    }

    return { transfers, options };
  }

  private getProvider(
    options: TransactionOptions | InvokeTransactionOptions = {},
  ): UserAccountProvider {
    const { from } = options;
    if (from == null) {
      return this.selectedProvider$.value;
    }

    const providers = Object.values(this.providers);
    const accountProvider = providers.find((provider) =>
      provider
        .getAccounts()
        .some(
          (account) =>
            account.id.network === from.network &&
            account.id.address === from.address,
        ),
    );

    if (accountProvider == null) {
      throw new UnknownAccountError(from.address);
    }

    return accountProvider;
  }

  private getNetworkProvider(network: NetworkType): UserAccountProvider {
    const providers = Object.values(this.providers);
    const accountProvider = providers.find((provider) =>
      provider.getAccounts().some((account) => account.id.network === network),
    );

    if (accountProvider == null) {
      throw new UnknownNetworkError(network);
    }

    return accountProvider;
  }
}
