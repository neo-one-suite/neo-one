import { Param as ScriptBuilderParam } from '@neo-one/client-core';
import BigNumber from 'bignumber.js';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { RawSourceMap } from 'source-map';
import * as argAssertions from './args';
import { UnknownAccountError, UnknownNetworkError } from './errors';
import { ReadClient } from './ReadClient';
import { createSmartContract } from './sc';
import {
  AddressString,
  AssetRegister,
  ContractRegister,
  Hash160String,
  Hash256String,
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

const mutableClients: Client[] = [];

// tslint:disable-next-line no-any
export class Client<TUserAccountProviders extends { readonly [K in string]: UserAccountProvider } = any> {
  public static inject(provider: UserAccountProvider): void {
    mutableClients.forEach((client) => client.inject(provider));
  }
  public readonly currentAccount$: Observable<UserAccount | undefined>;
  public readonly accounts$: Observable<ReadonlyArray<UserAccount>>;
  public readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  private readonly providers$: BehaviorSubject<TUserAccountProviders>;
  private readonly selectedProvider$: BehaviorSubject<UserAccountProvider>;

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

    mutableClients.push(this);

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

  public async transfer(
    amount: BigNumber,
    asset: Hash256String,
    to: AddressString,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;
  public async transfer(
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;
  // tslint:disable-next-line readonly-array no-any
  public async transfer(...args: any[]): Promise<TransactionResult<TransactionReceipt>> {
    const { transfers, options } = this.getTransfersOptions(args);

    return this.getProvider(options).transfer(transfers, options);
  }

  public async claim(options?: TransactionOptions): Promise<TransactionResult<TransactionReceipt>> {
    argAssertions.assertTransactionOptions(options);

    return this.getProvider(options).claim(options);
  }

  public async publish(
    contract: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt>> {
    argAssertions.assertTransactionOptions(options);
    argAssertions.assertContractRegister(contract);

    return this.getProvider(options).publish(contract, options);
  }

  public async registerAsset(
    asset: AssetRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt>> {
    argAssertions.assertAssetRegister(asset);
    argAssertions.assertTransactionOptions(options);

    return this.getProvider(options).registerAsset(asset, options);
  }

  public async issue(
    amount: BigNumber,
    asset: Hash256String,
    to: AddressString,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;
  public async issue(
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt>>;
  // tslint:disable-next-line readonly-array no-any
  public async issue(...args: any[]): Promise<TransactionResult<TransactionReceipt>> {
    const { transfers, options } = this.getTransfersOptions(args);

    return this.getProvider(options).issue(transfers, options);
  }

  public read(network: NetworkType): ReadClient {
    return new ReadClient(this.getNetworkProvider(network).read(network));
  }

  public smartContract(definition: SmartContractDefinition): SmartContract {
    argAssertions.assertSmartContractDefinition(definition);

    return createSmartContract({ definition, client: this });
  }

  public inject<K>(
    provider: K extends keyof TUserAccountProviders ? TUserAccountProviders[K] : UserAccountProvider,
  ): void {
    this.providers$.next(
      // tslint:disable-next-line prefer-object-spread
      Object.assign({}, this.providers, {
        [provider.type]: provider,
      }),
    );

    this.selectedProvider$.next(provider);
  }

  // internal
  public async invoke(
    contract: Hash160String,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    verify: boolean,
    options?: InvokeTransactionOptions,
    sourceMap?: RawSourceMap,
  ): Promise<TransactionResult<InvokeReceiptInternal>> {
    argAssertions.assertHash160(contract);
    argAssertions.assertBoolean(verify);

    return this.getProvider(options).invoke(contract, method, params, paramsZipped, verify, options, sourceMap);
  }

  public async call(
    contract: Hash160String,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    options?: TransactionOptions,
  ): Promise<RawInvocationResult> {
    argAssertions.assertHash160(contract);
    argAssertions.assertTransactionOptions(options);

    return this.getProvider(options).call(contract, method, params, options);
  }

  private getTransfersOptions(
    // tslint:disable-next-line no-any
    args: ReadonlyArray<any>,
  ): {
    readonly transfers: ReadonlyArray<Transfer>;
    readonly options?: TransactionOptions;
  } {
    argAssertions.assertTransfers(args);
    let transfers;
    let options;
    if (args.length >= 3) {
      transfers = [
        {
          amount: args[0],
          asset: args[1],
          to: args[2],
        },
      ];

      options = args[3];
    } else {
      transfers = args[0];
      options = args[1];
    }

    return { transfers, options };
  }

  private getProvider(options: TransactionOptions | InvokeTransactionOptions = {}): UserAccountProvider {
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

  private getNetworkProvider(network: NetworkType): UserAccountProvider {
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
