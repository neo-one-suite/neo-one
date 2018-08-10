import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { UnknownNetworkError } from '../../errors';
import {
  AddressString,
  GetOptions,
  Hash256String,
  Input,
  NetworkSettings,
  NetworkType,
  RawCallReceipt,
  RawInvocationData,
  Transaction,
  TransactionReceipt,
  UnspentOutput,
} from '../../types';
import { NEOONEDataProvider } from './NEOONEDataProvider';

export interface NEOONEProviderOptions {
  readonly network: NetworkType;
  readonly rpcURL: string;
}

export class NEOONEProvider {
  public readonly networks$: Observable<ReadonlyArray<NetworkType>>;
  private readonly networksInternal$: BehaviorSubject<ReadonlyArray<NetworkType>>;
  private readonly mutableProviders: { [K in string]?: NEOONEDataProvider };

  public constructor(options: ReadonlyArray<NEOONEProviderOptions> = []) {
    this.networksInternal$ = new BehaviorSubject([] as ReadonlyArray<NetworkType>);
    this.networks$ = this.networksInternal$;
    this.mutableProviders = {};

    const networks = options.map(({ network, rpcURL }) => {
      this.mutableProviders[network] = new NEOONEDataProvider({
        network,
        rpcURL,
      });

      return network;
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
  ): Promise<ReadonlyArray<UnspentOutput>> {
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

  public async getNetworkSettings(network: NetworkType, monitor?: Monitor): Promise<NetworkSettings> {
    return this.getProvider(network).getNetworkSettings(monitor);
  }

  public async getBlockCount(network: NetworkType, monitor?: Monitor): Promise<number> {
    return this.getProvider(network).getBlockCount(monitor);
  }

  public read(network: NetworkType): NEOONEDataProvider {
    return this.getProvider(network);
  }

  private getProvider(network: NetworkType): NEOONEDataProvider {
    const provider = this.mutableProviders[network];
    if (provider === undefined) {
      throw new UnknownNetworkError(network);
    }

    return provider;
  }
}
