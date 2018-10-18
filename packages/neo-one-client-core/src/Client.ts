// tslint:disable member-ordering
import {
  Account,
  AddressString,
  Block,
  BlockFilter,
  ClaimTransaction,
  GetOptions,
  Hash256String,
  InvocationTransaction,
  InvokeSendUnsafeReceiveTransactionOptions,
  NetworkType,
  Param,
  RawAction,
  RawCallReceipt,
  RawInvokeReceipt,
  ScriptBuilderParam,
  SmartContractDefinition,
  SourceMaps,
  Transaction,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UpdateAccountNameOptions,
  UserAccount,
  UserAccountID,
  UserAccountProvider,
  UserAccountProviders,
} from '@neo-one/client-common';
import { Monitor } from '@neo-one/monitor';
import { toObservable } from '@reactivex/ix-es2015-cjs/asynciterable';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { BehaviorSubject, combineLatest, Observable, Observer, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, filter, map, multicast, refCount, switchMap, take } from 'rxjs/operators';
import { AsyncParallelHook } from 'tapable';
import * as args from './args';
import { UnknownAccountError, UnknownNetworkError } from './errors';
import { createSmartContract } from './sc';
import { SmartContract, SmartContractAny } from './types';

export interface ClientHooks {
  readonly beforeRelay: AsyncParallelHook<TransactionOptions>;
  readonly relayError: AsyncParallelHook<Error>;
  readonly afterRelay: AsyncParallelHook<Transaction>;
  readonly beforeConfirmed: AsyncParallelHook<Transaction>;
  readonly confirmedError: AsyncParallelHook<Transaction, Error>;
  readonly afterConfirmed: AsyncParallelHook<Transaction, TransactionReceipt>;
  readonly afterCall: AsyncParallelHook<RawCallReceipt>;
  readonly callError: AsyncParallelHook<Error>;
}

export class Client<
  // tslint:disable-next-line no-any
  TUserAccountProvider extends UserAccountProvider = any,
  // tslint:disable-next-line no-any
  TUserAccountProviders extends UserAccountProviders<TUserAccountProvider> = any
> {
  public readonly hooks: ClientHooks;
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  public readonly userAccounts$: Observable<ReadonlyArray<UserAccount>>;
  public readonly currentNetwork$: Observable<NetworkType>;
  public readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  protected readonly providers$: BehaviorSubject<TUserAccountProviders>;
  protected readonly selectedProvider$: BehaviorSubject<TUserAccountProvider>;
  private readonly currentNetworkInternal$: BehaviorSubject<NetworkType>;
  private readonly reset$ = new BehaviorSubject<void>(undefined);

  public readonly block$: Observable<{
    readonly block: Block;
    readonly network: NetworkType;
  }>;

  public readonly accountState$: Observable<
    | {
        readonly currentAccount: UserAccount;
        readonly account: Account;
      }
    | undefined
  >;

  public constructor(providersIn: TUserAccountProviders) {
    this.hooks = {
      beforeRelay: new AsyncParallelHook(['beforeRelay']),
      relayError: new AsyncParallelHook(['error']),
      afterRelay: new AsyncParallelHook(['transaction']),
      beforeConfirmed: new AsyncParallelHook(['transaction']),
      confirmedError: new AsyncParallelHook(['transaction', 'error']),
      afterConfirmed: new AsyncParallelHook(['transaction', 'receipt']),
      afterCall: new AsyncParallelHook(['receipt']),
      callError: new AsyncParallelHook(['error']),
    };
    const providersArray = Object.values(providersIn);
    const providerIn =
      providersArray.find((provider) => provider.getCurrentUserAccount() !== undefined) ||
      (providersArray[0] as TUserAccountProvider | undefined);
    if (providerIn === undefined) {
      throw new Error('At least one provider is required');
    }

    if (Object.entries(providersIn).some(([type, provider]) => type !== provider.type)) {
      throw new Error('Provider keys must be named the same as their type');
    }

    this.providers$ = new BehaviorSubject(providersIn);
    this.selectedProvider$ = new BehaviorSubject(providerIn);

    this.currentUserAccount$ = this.selectedProvider$.pipe(switchMap((provider) => provider.currentUserAccount$));

    this.userAccounts$ = this.providers$.pipe(
      switchMap((providers) => combineLatest(Object.values(providers).map((provider) => provider.userAccounts$))),
      map((accountss) => accountss.reduce((acc, accounts) => acc.concat(accounts), [])),
    );

    this.networks$ = this.providers$.pipe(
      switchMap((providers) => combineLatest(Object.values(providers).map((provider) => provider.networks$))),
      map((networkss) => [...new Set(networkss.reduce((acc, networks) => acc.concat(networks), []))]),
    );

    this.currentNetworkInternal$ = new BehaviorSubject(providerIn.getNetworks()[0]);
    combineLatest(this.currentUserAccount$, this.selectedProvider$)
      .pipe(
        map(([currentAccount, provider]) => {
          if (currentAccount !== undefined) {
            return currentAccount.id.network;
          }

          const mainNetwork = provider.getNetworks().find((network) => network === 'main');

          return mainNetwork === undefined ? provider.getNetworks()[0] : mainNetwork;
        }),
      )
      .subscribe(this.currentNetworkInternal$);
    this.currentNetwork$ = this.currentNetworkInternal$.pipe(distinctUntilChanged());

    if (this.getCurrentUserAccount() === undefined) {
      this.userAccounts$
        .pipe(
          filter((accounts) => accounts.length > 0),
          take(1),
        )
        .toPromise()
        .then(async (accounts) => {
          const account = accounts[0] as UserAccount | undefined;
          if (this.getCurrentUserAccount() === undefined && account !== undefined) {
            await this.selectUserAccount(account.id);
          }
        })
        .catch(() => {
          // Just ignore errors here.
        });
    }

    this.block$ = this.reset$.pipe(
      switchMap(() =>
        this.currentNetwork$.pipe(
          switchMap((network) =>
            Observable.create((observer: Observer<Block>) =>
              toObservable(this.getNetworkProvider(network).iterBlocks(network)).subscribe(observer),
            ).pipe(map((block) => ({ block, network }))),
          ),
        ),
      ),
      multicast(() => new ReplaySubject(1)),
      refCount(),
    );
    this.accountState$ = combineLatest(this.currentUserAccount$, this.block$).pipe(
      switchMap(async ([currentAccount]) => {
        if (currentAccount === undefined) {
          return undefined;
        }

        const account = await this.getNetworkProvider(currentAccount.id.network).getAccount(
          currentAccount.id.network,
          currentAccount.id.address,
        );

        return { currentAccount, account };
      }),
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
      multicast(() => new ReplaySubject(1)),
      refCount(),
    );
  }

  public get providers(): TUserAccountProviders {
    return this.providers$.getValue();
  }

  public getUserAccount(idIn: UserAccountID): UserAccount {
    const id = args.assertUserAccountID('id', idIn);
    const provider = this.getProvider({ from: id });
    const account = provider
      .getUserAccounts()
      .find((acct) => acct.id.network === id.network && acct.id.address === id.address);

    if (account === undefined) {
      /* istanbul ignore next */
      throw new UnknownAccountError(id.address);
    }

    return account;
  }

  public async selectUserAccount(idIn?: UserAccountID): Promise<void> {
    const id = args.assertNullableUserAccountID('id', idIn);
    const provider = this.getProvider({ from: id });
    await provider.selectUserAccount(id);
    this.selectedProvider$.next(provider);
  }

  public async selectNetwork(networkIn: NetworkType): Promise<void> {
    const network = args.assertString('network', networkIn);
    const provider = this.getNetworkProvider(network);
    const account = provider.getCurrentUserAccount();
    if (account === undefined) {
      const accounts = provider.getUserAccounts();
      if (accounts.length > 0) {
        await provider.selectUserAccount(accounts[0].id);
      }
    }
    this.selectedProvider$.next(provider);
  }

  public async deleteUserAccount(idIn: UserAccountID): Promise<void> {
    const id = args.assertUserAccountID('id', idIn);
    await this.getProvider({ from: id }).deleteUserAccount(id);
  }

  public async updateUserAccountName(options: UpdateAccountNameOptions): Promise<void> {
    const { id, name } = args.assertUpdateAccountNameOptions('options', options);
    await this.getProvider({ from: id }).updateUserAccountName({ id, name });
  }

  public getCurrentUserAccount(): UserAccount | undefined {
    return this.selectedProvider$.getValue().getCurrentUserAccount();
  }

  public getCurrentNetwork(): NetworkType {
    return this.currentNetworkInternal$.getValue();
  }

  public getUserAccounts(): ReadonlyArray<UserAccount> {
    return Object.values(this.providers).reduce(
      (acc: UserAccount[], provider) => acc.concat(provider.getUserAccounts()),
      [],
    );
  }

  public getNetworks(): ReadonlyArray<NetworkType> {
    const providers = Object.values(this.providers);

    return [...new Set(providers.reduce((acc: NetworkType[], provider) => acc.concat(provider.getNetworks()), []))];
  }

  // tslint:disable-next-line no-any
  public smartContract<T extends SmartContract<any, any> = SmartContractAny>(definition: SmartContractDefinition): T {
    return createSmartContract({
      definition: args.assertSmartContractDefinition('definition', definition),
      client: this,
      // tslint:disable-next-line no-any
    }) as any;
  }

  public async transfer(
    amount: BigNumber,
    asset: Hash256String,
    to: AddressString,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, InvocationTransaction>>;
  public async transfer(transfers: ReadonlyArray<Transfer>, options?: TransactionOptions): Promise<TransactionResult>;
  // tslint:disable-next-line readonly-array no-any
  public async transfer(...argsIn: any[]): Promise<TransactionResult> {
    const { transfers, options } = this.getTransfersOptions(argsIn);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(this.getProvider(options).transfer(transfers, options));
  }

  public async claim(optionsIn?: TransactionOptions): Promise<TransactionResult> {
    const options = args.assertTransactionOptions('options', optionsIn);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(this.getProvider(options).claim(options));
  }

  public async getAccount(id: UserAccountID): Promise<Account> {
    return this.getNetworkProvider(id.network).getAccount(id.network, id.address);
  }

  // internal
  public __iterActionsRaw(network: NetworkType, blockFilter?: BlockFilter): AsyncIterable<RawAction> {
    return this.getNetworkProvider(network).iterActionsRaw(network, blockFilter);
  }

  public async __invoke(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    verify: boolean,
    optionsIn?: InvokeSendUnsafeReceiveTransactionOptions,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const options = optionsIn === undefined ? {} : optionsIn;
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).invoke(contract, method, params, paramsZipped, verify, options, sourceMaps),
    );
  }

  public async __invokeSend(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    transfer: Transfer,
    optionsIn?: TransactionOptions,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const options = optionsIn === undefined ? {} : optionsIn;
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).invokeSend(contract, method, params, paramsZipped, transfer, options, sourceMaps),
    );
  }

  public async __invokeCompleteSend(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    hash: Hash256String,
    optionsIn?: TransactionOptions,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const options = optionsIn === undefined ? {} : optionsIn;
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).invokeCompleteSend(contract, method, params, paramsZipped, hash, options, sourceMaps),
    );
  }

  public async __invokeRefundAssets(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    hash: Hash256String,
    optionsIn?: TransactionOptions,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    const options = optionsIn === undefined ? {} : optionsIn;
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).invokeRefundAssets(contract, method, params, paramsZipped, hash, options, sourceMaps),
    );
  }

  public async __invokeClaim(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    optionsIn?: TransactionOptions,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<TransactionReceipt, ClaimTransaction>> {
    const options = optionsIn === undefined ? {} : optionsIn;
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).invokeClaim(contract, method, params, paramsZipped, options, sourceMaps),
    );
  }

  public async __call(
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ): Promise<RawCallReceipt> {
    try {
      const receipt = await this.getNetworkProvider(network).call(network, contract, method, params, monitor);
      await this.hooks.afterCall.promise(receipt);

      return receipt;
    } catch (error) {
      await this.hooks.callError.promise(error);

      throw error;
    }
  }

  public reset(): void {
    this.reset$.next(undefined);
  }

  protected getProvider(options: TransactionOptions = {}): TUserAccountProvider {
    const { from } = options;
    if (from === undefined) {
      return this.selectedProvider$.getValue();
    }

    const providers = Object.values(this.providers);
    const accountProvider = providers.find((provider) =>
      provider
        .getUserAccounts()
        .some((account) => account.id.network === from.network && account.id.address === from.address),
    );

    if (accountProvider === undefined) {
      throw new UnknownAccountError(from.address);
    }

    return accountProvider;
  }

  protected getNetworkProvider(network: NetworkType): TUserAccountProvider {
    const providers = Object.values(this.providers);
    const accountProvider = providers.find((provider) =>
      provider.getNetworks().some((providerNetwork) => providerNetwork === network),
    );

    if (accountProvider === undefined) {
      throw new UnknownNetworkError(network);
    }

    return accountProvider;
  }

  protected async applyBeforeRelayHook(options: TransactionOptions): Promise<void> {
    try {
      await this.hooks.beforeRelay.promise(options);
    } catch {
      // do nothing
    }
  }

  protected async addTransactionHooks<TTransactionResult extends TransactionResult>(
    res: Promise<TTransactionResult>,
  ): Promise<TTransactionResult> {
    return res
      .then(async (result) => {
        try {
          await this.hooks.afterRelay.promise(result.transaction);
        } catch {
          // do nothing
        }

        // tslint:disable-next-line prefer-object-spread
        return Object.assign({}, result, {
          // tslint:disable-next-line no-unnecessary-type-annotation
          confirmed: async (options?: GetOptions) => {
            try {
              await this.hooks.beforeConfirmed.promise(result.transaction);
            } catch {
              // do nothing
            }
            try {
              const receipt = await result.confirmed(options);
              try {
                await this.hooks.afterConfirmed.promise(result.transaction, receipt);
              } catch {
                // do nothing
              }

              return receipt;
            } catch (error) {
              try {
                await this.hooks.confirmedError.promise(result.transaction, error);
              } catch {
                // do nothing
              }

              throw error;
            }
          },
        });
      })
      .catch(async (error) => {
        await this.hooks.relayError.promise(error);

        throw error;
      });
  }

  protected getTransfersOptions(
    // tslint:disable-next-line no-any
    argsIn: ReadonlyArray<any>,
  ): {
    readonly transfers: ReadonlyArray<Transfer>;
    readonly options: TransactionOptions;
  } {
    let transfers;
    let options;
    if (argsIn.length >= 3) {
      transfers = [
        {
          amount: argsIn[0],
          asset: argsIn[1],
          to: argsIn[2],
        },
      ];

      options = argsIn[3];
    } else {
      transfers = argsIn[0];
      options = argsIn[1];
    }

    return {
      transfers: args.assertTransfers('transfers', transfers),
      options: args.assertTransactionOptions('options', options),
    };
  }
}
