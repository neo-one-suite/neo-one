// tslint:disable member-ordering
import { ScriptBuilderParam } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { toObservable } from '@reactivex/ix-es2015-cjs/asynciterable';
import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { BehaviorSubject, combineLatest, Observable, Observer, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, map, multicast, refCount, switchMap } from 'rxjs/operators';
import * as args from './args';
import { ClientBase } from './ClientBase';
import { ReadClient } from './ReadClient';
import { createSmartContract } from './sc';
import {
  ABI,
  Account,
  AddressString,
  AssetRegister,
  Block,
  ContractRegister,
  ContractTransaction,
  GetOptions,
  Hash256String,
  InvocationTransaction,
  InvokeTransactionOptions,
  IssueTransaction,
  NetworkType,
  Param,
  PublishReceipt,
  RawCallReceipt,
  RawInvokeReceipt,
  RegisterAssetReceipt,
  SmartContract,
  SmartContractAny,
  SmartContractDefinition,
  SourceMaps,
  TransactionOptions,
  TransactionReceipt,
  TransactionResult,
  Transfer,
  UserAccount,
  UserAccountProvider,
} from './types';
const mutableClients: Client[] = [];

export class Client<
  // tslint:disable-next-line no-any
  TUserAccountProviders extends { readonly [K: string]: UserAccountProvider } = any
> extends ClientBase<TUserAccountProviders> {
  public static inject(provider: UserAccountProvider): void {
    mutableClients.forEach((client) => client.inject(provider));
  }

  private readonly reset$ = new BehaviorSubject<void>(undefined);

  public readonly block$: Observable<{
    readonly block: Block;
    readonly network: NetworkType;
  }> = this.reset$.pipe(
    switchMap(() =>
      this.currentNetwork$.pipe(
        switchMap((network) =>
          Observable.create((observer: Observer<Block>) =>
            toObservable(this.read(network).iterBlocks()).subscribe(observer),
          ).pipe(map((block) => ({ block, network }))),
        ),
      ),
    ),
    multicast(() => new ReplaySubject(1)),
    refCount(),
  );

  public readonly accountState$: Observable<
    | {
        readonly currentAccount: UserAccount;
        readonly account: Account;
      }
    | undefined
  > = combineLatest(this.currentAccount$, this.block$).pipe(
    switchMap(async ([currentAccount]) => {
      if (currentAccount === undefined) {
        return undefined;
      }

      const account = await this.read(currentAccount.id.network).getAccount(currentAccount.id.address);

      return { currentAccount, account };
    }),
    distinctUntilChanged((a, b) => _.isEqual(a, b)),
    multicast(() => new ReplaySubject(1)),
    refCount(),
  );

  public constructor(providersIn: TUserAccountProviders) {
    super(providersIn);
    mutableClients.push(this);
  }

  public async transfer(
    amount: BigNumber,
    asset: Hash256String,
    to: AddressString,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, ContractTransaction>>;
  public async transfer(transfers: ReadonlyArray<Transfer>, options?: TransactionOptions): Promise<TransactionResult>;
  // tslint:disable-next-line readonly-array no-any
  public async transfer(...argsIn: any[]): Promise<TransactionResult> {
    const { transfers, options } = this.getTransfersOptions(argsIn);

    return this.addTransactionHooks(this.getProvider(options).transfer(transfers, options));
  }

  public async claim(options?: TransactionOptions): Promise<TransactionResult> {
    return this.getProvider(options).claim(args.assertTransactionOptions('options', options));
  }

  public async publish(
    contract: ContractRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<PublishReceipt, InvocationTransaction>> {
    return this.addTransactionHooks(
      this.getProvider(options).publish(
        args.assertContractRegister('contract', contract),
        args.assertTransactionOptions('options', options),
      ),
    );
  }

  public async publishAndDeploy(
    contract: ContractRegister,
    abi: ABI,
    params: ReadonlyArray<Param> = [],
    options?: TransactionOptions,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<PublishReceipt, InvocationTransaction>> {
    return this.addTransactionHooks(
      this.getProvider(options).publishAndDeploy(
        args.assertContractRegister('contract', contract),
        args.assertABI('abi', abi),
        params,
        args.assertTransactionOptions('options', options),
        sourceMaps,
      ),
    );
  }

  public async registerAsset(
    asset: AssetRegister,
    options?: TransactionOptions,
  ): Promise<TransactionResult<RegisterAssetReceipt, InvocationTransaction>> {
    return this.addTransactionHooks(
      this.getProvider(options).registerAsset(
        args.assertAssetRegister('asset', asset),
        args.assertTransactionOptions('options', options),
      ),
    );
  }

  public async issue(
    amount: BigNumber,
    asset: Hash256String,
    to: AddressString,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, IssueTransaction>>;
  public async issue(
    transfers: ReadonlyArray<Transfer>,
    options?: TransactionOptions,
  ): Promise<TransactionResult<TransactionReceipt, IssueTransaction>>;
  // tslint:disable-next-line readonly-array no-any
  public async issue(...argsIn: any[]): Promise<TransactionResult<TransactionReceipt, IssueTransaction>> {
    const { transfers, options } = this.getTransfersOptions(argsIn);

    return this.addTransactionHooks(this.getProvider(options).issue(transfers, options));
  }

  public read(network: NetworkType): ReadClient {
    return new ReadClient(
      this.getNetworkProvider(args.assertString('network', network)).read(args.assertString('network', network)),
    );
  }

  // tslint:disable-next-line no-any
  public smartContract<T extends SmartContract<any> = SmartContractAny>(definition: SmartContractDefinition): T {
    return createSmartContract({
      definition: args.assertSmartContractDefinition('definition', definition),
      client: this,
      // tslint:disable-next-line no-any
    }) as any;
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
  public async __invoke(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    paramsZipped: ReadonlyArray<[string, Param | undefined]>,
    verify: boolean,
    options?: InvokeTransactionOptions,
    sourceMaps: Promise<SourceMaps> = Promise.resolve({}),
  ): Promise<TransactionResult<RawInvokeReceipt, InvocationTransaction>> {
    return this.addTransactionHooks(
      this.getProvider(options).invoke(contract, method, params, paramsZipped, verify, options, sourceMaps),
    );
  }

  public async __call(
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ): Promise<RawCallReceipt> {
    return this.getNetworkProvider(network).call(network, contract, method, params, monitor);
  }

  public reset(): void {
    this.reset$.next(undefined);
  }

  private async addTransactionHooks<TTransactionResult extends TransactionResult>(
    res: Promise<TTransactionResult>,
  ): Promise<TTransactionResult> {
    return res.then(async (result) => {
      await this.hooks.afterRelay.promise(result.transaction);

      // tslint:disable-next-line prefer-object-spread
      return Object.assign({}, result, {
        // tslint:disable-next-line no-unnecessary-type-annotation
        confirmed: async (options?: GetOptions) => {
          await this.hooks.beforeConfirmed.promise(result.transaction);
          const receipt = await result.confirmed(options);
          await this.hooks.afterConfirmed.promise(result.transaction, receipt);

          return receipt;
        },
      });
    });
  }

  private getTransfersOptions(
    // tslint:disable-next-line no-any
    argsIn: ReadonlyArray<any>,
  ): {
    readonly transfers: ReadonlyArray<Transfer>;
    readonly options?: TransactionOptions;
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
