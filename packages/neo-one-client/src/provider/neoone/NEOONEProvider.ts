import { ScriptBuilderParam } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { UnknownNetworkError } from '../../errors';
import {
  AddressString,
  GetOptions,
  Hash256String,
  Input,
  InputOutput,
  NetworkSettings,
  NetworkType,
  Output,
  RawCallReceipt,
  RawInvocationData,
  Transaction,
  TransactionReceipt,
} from '../../types';
import { NEOONEDataProvider, NEOONEDataProviderOptions } from './NEOONEDataProvider';
import { NEOONEOneDataProvider } from './NEOONEOneDataProvider';

export class NEOONEProvider {
  public readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  private readonly networksInternal$: BehaviorSubject<ReadonlyArray<NetworkType>>;
  // tslint:disable-next-line readonly-keyword
  private readonly mutableProviders: { [key: string]: NEOONEDataProvider | NEOONEOneDataProvider | undefined };

  public constructor(
    options: ReadonlyArray<NEOONEDataProviderOptions | NEOONEOneDataProvider | NEOONEDataProvider> = [],
  ) {
    this.networksInternal$ = new BehaviorSubject<ReadonlyArray<NetworkType>>([]);
    this.networks$ = this.networksInternal$;
    this.mutableProviders = {};

    const networks = options.map((opts) => {
      this.mutableProviders[opts.network] =
        opts instanceof NEOONEDataProvider || opts instanceof NEOONEOneDataProvider
          ? opts
          : new NEOONEDataProvider(opts);

      return opts.network;
    });

    this.networksInternal$.next(networks);
  }

  public getNetworks(): ReadonlyArray<NetworkType> {
    return this.networksInternal$.getValue();
  }

  public addNetwork({ network, rpcURL }: { readonly network: NetworkType; readonly rpcURL: string }): void {
    this.mutableProviders[network] = new NEOONEDataProvider({ network, rpcURL });
    const networks = this.networksInternal$.value.filter((net) => network !== net).concat([network]);
    this.networksInternal$.next(networks);
  }

  public async getUnclaimed(
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ): Promise<{ readonly unclaimed: ReadonlyArray<Input>; readonly amount: BigNumber }> {
    return this.getProvider(network).getUnclaimed(address, monitor);
  }

  public async getUnspentOutputs(
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ): Promise<ReadonlyArray<InputOutput>> {
    return this.getProvider(network).getUnspentOutputs(address, monitor);
  }

  public async relayTransaction(network: NetworkType, transaction: string, monitor?: Monitor): Promise<Transaction> {
    return this.getProvider(network).relayTransaction(transaction, monitor);
  }

  public async getTransactionReceipt(
    network: NetworkType,
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceipt> {
    return this.getProvider(network).getTransactionReceipt(hash, options);
  }

  public async getInvocationData(
    network: NetworkType,
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<RawInvocationData> {
    return this.getProvider(network).getInvocationData(hash, monitor);
  }

  public async testInvoke(network: NetworkType, transaction: string, monitor?: Monitor): Promise<RawCallReceipt> {
    return this.getProvider(network).testInvoke(transaction, monitor);
  }

  public async call(
    network: NetworkType,
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ): Promise<RawCallReceipt> {
    return this.getProvider(network).call(contract, method, params, monitor);
  }

  public async getNetworkSettings(network: NetworkType, monitor?: Monitor): Promise<NetworkSettings> {
    return this.getProvider(network).getNetworkSettings(monitor);
  }

  public async getBlockCount(network: NetworkType, monitor?: Monitor): Promise<number> {
    return this.getProvider(network).getBlockCount(monitor);
  }

  public async getTransaction(network: NetworkType, hash: Hash256String, monitor?: Monitor): Promise<Transaction> {
    return this.getProvider(network).getTransaction(hash, monitor);
  }

  public async getOutput(network: NetworkType, input: Input, monitor?: Monitor): Promise<Output> {
    return this.getProvider(network).getOutput(input, monitor);
  }

  public async getClaimAmount(network: NetworkType, input: Input, monitor?: Monitor): Promise<BigNumber> {
    return this.getProvider(network).getClaimAmount(input, monitor);
  }

  public read(network: NetworkType): NEOONEDataProvider | NEOONEOneDataProvider {
    return this.getProvider(network);
  }

  private getProvider(network: NetworkType): NEOONEDataProvider | NEOONEOneDataProvider {
    const provider = this.mutableProviders[network];
    if (provider === undefined) {
      throw new UnknownNetworkError(network);
    }

    return provider;
  }
}
