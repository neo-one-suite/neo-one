/// <reference types="@reactivex/ix-es2015-cjs" />
// tslint:disable member-ordering readonly-array no-any
import {
  Account,
  AddressString,
  Block,
  GetOptions,
  IterOptions,
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
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { flatMap } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatmap';
import { toObservable } from '@reactivex/ix-es2015-cjs/asynciterable/toobservable';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { BehaviorSubject, combineLatest, Observable, Observer, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, filter, map, multicast, refCount, switchMap, take } from 'rxjs/operators';
import { AsyncParallelHook } from 'tapable';
import * as args from './args';
import {
  DeleteUserAccountUnsupportedError,
  UnknownAccountError,
  UnknownNetworkError,
  UpdateUserAccountUnsupportedError,
} from './errors';
import { createSmartContract } from './sc';
import { SmartContract, SmartContractAny } from './types';

/**
 * Object which contains the points that can be hooked into on the `Client`.
 */
export interface ClientHooks {
  /**
   * Called before the `Transaction` is relayed.
   */
  readonly beforeRelay: AsyncParallelHook<TransactionOptions>;
  /**
   * Called when there is an `Error` thrown during relaying a `Transaction`.
   */
  readonly relayError: AsyncParallelHook<Error>;
  /**
   * Called after successfully relaying a `Transaction`.
   */
  readonly afterRelay: AsyncParallelHook<Transaction>;
  /**
   * Called when the `confirmed` method of a `TransactionResult` is invoked.
   */
  readonly beforeConfirmed: AsyncParallelHook<Transaction>;
  /**
   * Called when there is an `Error` thrown during the `confirmed` method of a `TransactionResult`.
   */
  readonly confirmedError: AsyncParallelHook<Transaction, Error>;
  /**
   * Called after the `confirmed` method of a `TransactionResult` resolves.
   */
  readonly afterConfirmed: AsyncParallelHook<Transaction, TransactionReceipt>;
  /**
   * Called after a constant method is invoked.
   */
  readonly afterCall: AsyncParallelHook<RawCallReceipt>;
  /**
   * Called when an `Error` is thrown from a constant method invocation.
   */
  readonly callError: AsyncParallelHook<Error>;
}

/**
 * Properties represent features that a given `UserAccountID` supports.
 */
export interface UserAccountFeatures {
  /**
   * `true` if the `UserAccountID` can be deleted.
   */
  readonly delete: boolean;
  /**
   * `true` if the `name` of the `UserAccount` associated with the `UserAccountID` can be updated.
   */
  readonly updateName: boolean;
}

/**
 * `Client#block$` `Observable` item.
 */
export interface BlockEntry {
  /**
   * Emitted block.
   */
  readonly block: Block;
  /**
   * Network of the block.
   */
  readonly network: NetworkType;
}

/**
 * `Client#accountState$` `Observable` item.
 */
export interface AccountStateEntry {
  /**
   * Currently selected `UserAccount`
   */
  readonly currentUserAccount: UserAccount;
  /**
   * Blockchain account info for `currentUserAccount`
   */
  readonly account: Account;
}

/**
 * Main entrypoint to the `@neo-one/client` APIs. The `Client` class abstracts away user accounts and even how those accounts are provided to your dapp, for example, they might come from an extension like NEX, dapp browser like nOS or through some other integration.
 *
 * See the [Client APIs](https://neo-one.io/docs/client-apis) chapter of the main guide for more information.
 */
export class Client<
  // tslint:disable-next-line no-any
  TUserAccountProvider extends UserAccountProvider = any,
  // tslint:disable-next-line no-any
  TUserAccountProviders extends UserAccountProviders<TUserAccountProvider> = any,
> {
  /**
   * Hook into the lifecycle of various requests. Can be used to automatically add logging, or parameter transformations across the application, for example.
   */
  public readonly hooks: ClientHooks;
  /**
   * Emits a value whenever a new user account is selected.
   *
   * Immediately emits the latest value when subscribed to.
   */
  public readonly currentUserAccount$: Observable<UserAccount | undefined>;
  /**
   * Emits a value whenever a new list of user accounts is available.
   *
   * Immediately emits the latest value when subscribed to.
   */
  public readonly userAccounts$: Observable<readonly UserAccount[]>;
  /**
   * Emits a value whenever a new network is selected.
   *
   * Immediately emits the latest value when subscribed to.
   */

  public readonly currentNetwork$: Observable<NetworkType>;
  /**
   * Emits a value whenever a new list of networks user account is available.
   *
   * Immediately emits the latest value when subscribed to.
   */
  public readonly networks$: Observable<readonly NetworkType[]>;
  protected readonly providers$: BehaviorSubject<TUserAccountProviders>;
  protected readonly selectedProvider$: BehaviorSubject<TUserAccountProvider>;
  private readonly currentNetworkInternal$: BehaviorSubject<NetworkType>;
  private readonly reset$ = new BehaviorSubject<void>(undefined);

  /**
   * Emits a value whenever a block is persisted to the blockchain.
   *
   * Immediately emits the latest block/network when subscribed to.
   */
  public readonly block$: Observable<BlockEntry>;

  /**
   * Emits a value whenever a new user account is selected and whenever a block is persisted to the blockchain.
   *
   * Immediately emits the latest value when subscribed to.
   */
  public readonly accountState$: Observable<AccountStateEntry | undefined>;

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
    combineLatest([this.currentUserAccount$, this.selectedProvider$])
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
        /* istanbul ignore next */
        .catch(() => {
          // Just ignore errors here.
        });
    }

    this.block$ = this.reset$.pipe(
      switchMap(() =>
        this.currentNetwork$.pipe(
          switchMap((network) =>
            new Observable((observer: Observer<Block>) =>
              toObservable(this.getNetworkProvider(network).iterBlocks(network)).subscribe(observer),
            ).pipe(map((block) => ({ block, network }))),
          ),
        ),
      ),
      multicast(() => new ReplaySubject<BlockEntry>(1)),
      refCount(),
    );
    this.accountState$ = combineLatest([this.currentUserAccount$, this.block$]).pipe(
      switchMap(async ([currentUserAccount]) => {
        if (currentUserAccount === undefined) {
          return undefined;
        }

        const account = await this.getNetworkProvider(currentUserAccount.id.network).getAccount(
          currentUserAccount.id.network,
          currentUserAccount.id.address,
        );

        return { currentUserAccount, account };
      }),
      distinctUntilChanged((a, b) => _.isEqual(a, b)),
      multicast(() => new ReplaySubject<AccountStateEntry | undefined>(1)),
      refCount(),
    );
  }

  /**
   * The configured `UserAccountProvider`s for this `Client` instance.
   */
  public get providers(): TUserAccountProviders {
    return this.providers$.getValue();
  }

  /**
   * Get the details of the `UserAccount` for a given `UserAccountID`.
   *
   * @param idIn `UserAccountID` to find the `UserAccount` for
   * @returns `UserAccount` or throws an `UnknownAccountError` if one could not be found.
   */
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

  /**
   * Sets a `UserAccountID` as the currently selected `UserAccountID`.
   *
   * @param idIn `UserAccountID` to select, or `undefined` to deselect the current `UserAccountID`.
   */
  public async selectUserAccount(idIn?: UserAccountID): Promise<void> {
    const id = args.assertNullableUserAccountID('id', idIn);
    const provider = this.getProvider({ from: id });
    await provider.selectUserAccount(id);
    this.selectedProvider$.next(provider);
  }

  /**
   * Sets a `NetworkType` as the currently selected `NetworkType`.
   *
   * @param networkIn `NetworkType` to select.
   */
  public async selectNetwork(network: NetworkType): Promise<void> {
    args.assertString('network', network);
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

  /**
   * @returns `Promise` which resolves to the `UserAccountFeatures` supported by the given `UserAccountID`.
   */
  public async getSupportedFeatures(idIn: UserAccountID): Promise<UserAccountFeatures> {
    const id = args.assertUserAccountID('id', idIn);
    const provider = this.getProvider({ from: id });

    return {
      delete: provider.deleteUserAccount !== undefined,
      updateName: provider.updateUserAccountName !== undefined,
    };
  }

  /**
   * Deletes the `UserAccountID` from its underlying provider. Throws an `DeleteUserAccountUnsupportedError` if the operation is unsupported.
   *
   * Users should check `getSupportedFeatures` before calling this method.
   */
  public async deleteUserAccount(idIn: UserAccountID): Promise<void> {
    const id = args.assertUserAccountID('id', idIn);
    const provider = this.getProvider({ from: id });
    if (provider.deleteUserAccount === undefined) {
      throw new DeleteUserAccountUnsupportedError(id);
    }

    await provider.deleteUserAccount(id);
  }

  /**
   * Updates the name of the `UserAccountID` in the underlying provider. Throws an `UpdateUserAccountUnsupportedError` if the operation is unsupported.
   *
   * Users should check `getSupportedFeatures` before calling this method.
   */
  public async updateUserAccountName(options: UpdateAccountNameOptions): Promise<void> {
    const { id, name } = args.assertUpdateAccountNameOptions('options', options);
    const provider = this.getProvider({ from: id });
    if (provider.updateUserAccountName === undefined) {
      throw new UpdateUserAccountUnsupportedError(id);
    }

    await provider.updateUserAccountName({ id, name });
  }

  /**
   * @returns the currently selected `UserAccount` or `undefined` if there are no `UserAccount`s.
   */
  public getCurrentUserAccount(): UserAccount | undefined {
    return this.selectedProvider$.getValue().getCurrentUserAccount();
  }

  /**
   * @returns the currently selected `NetworkType`
   */
  public getCurrentNetwork(): NetworkType {
    return this.currentNetworkInternal$.getValue();
  }

  /**
   * @returns a list of all available `UserAccount`s
   */
  public getUserAccounts(): readonly UserAccount[] {
    return Object.values(this.providers).reduce(
      (acc: UserAccount[], provider) => acc.concat(provider.getUserAccounts()),
      [],
    );
  }

  /**
   * @returns a list of all available `NetworkType`s
   */
  public getNetworks(): readonly NetworkType[] {
    const providers = Object.values(this.providers);

    return [...new Set(providers.reduce((acc: NetworkType[], provider) => acc.concat(provider.getNetworks()), []))];
  }

  /**
   * Constructs a `SmartContract` instance for the provided `definition` backed by this `Client` instance.
   */
  public smartContract<T extends SmartContract<any, any> = SmartContractAny>(definition: SmartContractDefinition): T {
    return createSmartContract({
      definition: args.assertSmartContractDefinition('definition', definition),
      client: this,
      // tslint:disable-next-line no-any
    }) as any;
  }

  /**
   * Transfer native assets in the specified amount(s) to the specified Address(es).
   *
   * Accepts either a single transfer or an array of transfer objects.
   *
   * @returns `Promise<TransactionResult<TransactionReceipt, Transaction>>`.
   */
  public async transfer(
    amount: BigNumber,
    asset: AddressString,
    to: AddressString,
    options?: TransactionOptions,
  ): Promise<TransactionResult>;
  public async transfer(transfers: readonly Transfer[], options?: TransactionOptions): Promise<TransactionResult>;
  public async transfer(...argsIn: any[]): Promise<TransactionResult> {
    const { transfers, options } = this.getTransfersOptions(argsIn);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(this.getProvider(options).transfer(transfers, options));
  }

  /**
   * Claim all available unclaimed `GAS` for the currently selected account (or the specified `from` `UserAccountID`).
   */
  public async claim(optionsIn?: TransactionOptions): Promise<TransactionResult> {
    const options = args.assertTransactionOptions('options', optionsIn);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(this.getProvider(options).claim(options));
  }

  /**
   * @returns `Promise` which resolves to an `Account` object for the provided `UserAccountID`.
   */
  public async getAccount(idIn: UserAccountID): Promise<Account> {
    const id = args.assertUserAccountID('id', idIn);

    return this.getNetworkProvider(id.network).getAccount(id.network, id.address);
  }

  public __iterActionsRaw(network: NetworkType, optionsIn?: IterOptions): AsyncIterable<RawAction> {
    args.assertString('network', network);
    const options = args.assertNullableIterOptions('iterOptions', optionsIn);
    const provider = this.getNetworkProvider(network);
    if (provider.iterActionsRaw !== undefined) {
      return provider.iterActionsRaw(network, options);
    }

    return AsyncIterableX.from(provider.iterBlocks(network, options)).pipe<RawAction>(
      flatMap(async (block) => {
        const actions = _.flatten(block.transactions.map((transaction) => [...transaction.transactionData.actions]));

        return AsyncIterableX.of(...actions);
      }),
    );
  }

  /**
   * @internal
   */
  public async __invoke(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<readonly [string, Param | undefined]>,
    verify: boolean,
    optionsIn?: TransactionOptions,
    sourceMaps: SourceMaps = {},
  ): Promise<TransactionResult<RawInvokeReceipt>> {
    args.assertAddress('contract', contract);
    args.assertString('method', method);
    args.assertArray('params', params).forEach((param) => args.assertNullableScriptBuilderParam('params.param', param));
    paramsZipped.forEach(([tupleString, tupleParam]) => [
      args.assertString('tupleString', tupleString),
      args.assertNullableParam('tupleParam', tupleParam),
    ]);
    args.assertArray('paramsZipped', paramsZipped);
    args.assertBoolean('verify', verify);
    const options = args.assertInvokeSendUnsafeReceiveTransactionOptions('options', optionsIn);
    args.assertSourceMaps('sourceMaps', sourceMaps);
    await this.applyBeforeRelayHook(options);

    return this.addTransactionHooks(
      this.getProvider(options).invoke(contract, method, params, paramsZipped, verify, options, sourceMaps),
    );
  }

  /**
   * @internal
   */
  public async __call(
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ): Promise<RawCallReceipt> {
    try {
      args.assertString('network', network);
      const contractHash = args.tryGetUInt160Hex('contract', contract);
      args.assertString('method', method);
      args
        .assertArray('params', params)
        .forEach((param) => args.assertNullableScriptBuilderParam('params.param', param));
      const receipt = await this.getNetworkProvider(network).call(network, contractHash, method, params);
      await this.hooks.afterCall.promise(receipt);

      return receipt;
    } catch (error) {
      await this.hooks.callError.promise(error);

      throw error;
    }
  }

  /**
   * @internal
   */
  public reset(): void {
    this.reset$.next(undefined);
  }

  protected getProvider(options: TransactionOptions = {}): TUserAccountProvider {
    const { from } = args.assertTransactionOptions('options', options);
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
    args.assertString('network', network);
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

  protected getTransfersOptions(argsIn: readonly any[]): {
    readonly transfers: readonly Transfer[];
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
