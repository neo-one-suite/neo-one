import { Monitor } from '@neo-one/monitor';
import BigNumber from 'bignumber.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { UnknownNetworkError } from '../../errors';
import * as networkConfigs from '../../networks';
import {
  AddressString,
  GetOptions,
  Hash256String,
  Input,
  NetworkSettings,
  NetworkType,
  RawInvocationData,
  RawInvocationResult,
  Transaction,
  TransactionReceipt,
  UnspentOutput,
} from '../../types';
import { NEOONEDataProvider } from './NEOONEDataProvider';

export interface NEOONEProviderOptions {
  network: NetworkType;
  rpcURL: string;
}

export class NEOONEProvider {
  public readonly networks$: Observable<NetworkType[]>;
  private readonly networksInternal$: BehaviorSubject<NetworkType[]>;
  private readonly providers: { [type: string]: NEOONEDataProvider };

  constructor(
    input: {
      mainRPCURL?: string;
      testRPCURL?: string;
      options?: NEOONEProviderOptions[];
    } = {},
  ) {
    const {
      mainRPCURL: mainRPCURLIn,
      testRPCURL: testRPCURLIn,
      options,
    } = input;
    this.networksInternal$ = new BehaviorSubject([] as NetworkType[]);
    this.networks$ = this.networksInternal$;
    this.providers = {};

    let hasMain = false;
    let hasTest = false;
    const networks = (options || []).map(({ network, rpcURL }) => {
      if (network === networkConfigs.MAIN) {
        hasMain = true;
      }

      if (network === networkConfigs.TEST) {
        hasTest = true;
      }

      this.providers[network] = new NEOONEDataProvider({
        network,
        rpcURL,
      });

      return network;
    });

    if (!hasMain) {
      const mainRPCURL =
        mainRPCURLIn == null ? networkConfigs.MAIN_URL : mainRPCURLIn;
      this.providers.main = new NEOONEDataProvider({
        network: networkConfigs.MAIN,
        rpcURL: mainRPCURL,
      });

      networks.push(networkConfigs.MAIN);
    }

    if (!hasTest) {
      const testRPCURL =
        testRPCURLIn == null ? networkConfigs.TEST_URL : testRPCURLIn;
      this.providers.test = new NEOONEDataProvider({
        network: networkConfigs.TEST,
        rpcURL: testRPCURL,
      });

      networks.push(networkConfigs.TEST);
    }

    this.networksInternal$.next(networks);
  }

  public getNetworks(): NetworkType[] {
    return this.networksInternal$.getValue();
  }

  public addNetwork({
    network,
    rpcURL,
  }: {
    network: NetworkType;
    rpcURL: string;
  }): void {
    this.providers[network] = new NEOONEDataProvider({ network, rpcURL });
    const networks = this.networksInternal$.value.filter(
      (net) => network !== net,
    );
    networks.push(network);
    this.networksInternal$.next(networks);
  }

  public getUnclaimed(
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ): Promise<{ unclaimed: Input[]; amount: BigNumber }> {
    return this.getProvider(network).getUnclaimed(address, monitor);
  }

  public getUnspentOutputs(
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ): Promise<UnspentOutput[]> {
    return this.getProvider(network).getUnspentOutputs(address, monitor);
  }

  public relayTransaction(
    network: NetworkType,
    transaction: string,
    monitor?: Monitor,
  ): Promise<Transaction> {
    return this.getProvider(network).relayTransaction(transaction, monitor);
  }

  public getTransactionReceipt(
    network: NetworkType,
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceipt> {
    return this.getProvider(network).getTransactionReceipt(hash, options);
  }

  public getInvocationData(
    network: NetworkType,
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<RawInvocationData> {
    return this.getProvider(network).getInvocationData(hash, monitor);
  }

  public testInvoke(
    network: NetworkType,
    transaction: string,
    monitor?: Monitor,
  ): Promise<RawInvocationResult> {
    return this.getProvider(network).testInvoke(transaction, monitor);
  }

  public getNetworkSettings(
    network: NetworkType,
    monitor?: Monitor,
  ): Promise<NetworkSettings> {
    return this.getProvider(network).getNetworkSettings(monitor);
  }

  public read(network: NetworkType): NEOONEDataProvider {
    return this.getProvider(network);
  }

  private getProvider(network: NetworkType): NEOONEDataProvider {
    const provider = this.providers[network];
    if (provider == null) {
      throw new UnknownNetworkError(network);
    }

    return provider;
  }
}
