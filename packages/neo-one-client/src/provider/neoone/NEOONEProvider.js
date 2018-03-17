/* @flow */
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import type BigNumber from 'bignumber.js';
import type { Monitor } from '@neo-one/monitor';
import type { Observable } from 'rxjs/Observable';

import type {
  AddressString,
  GetOptions,
  Hash256String,
  Input,
  RawInvocationData,
  RawInvocationResult,
  NetworkSettings,
  NetworkType,
  Transaction,
  TransactionReceipt,
  UnspentOutput,
} from '../../types';
import NEOONEDataProvider from './NEOONEDataProvider';
import { UnknownNetworkError } from '../../errors';

import * as networkConfigs from '../../networks';

export type ProviderOptions = {|
  network: NetworkType,
  rpcURL: string,
|};

export default class NEOONEProvider {
  networks$: Observable<Array<NetworkType>>;
  _networks$: BehaviorSubject<Array<NetworkType>>;

  _providers: { [type: string]: NEOONEDataProvider };

  constructor(input?: {|
    mainRPCURL?: string,
    testRPCURL?: string,
    options?: Array<ProviderOptions>,
  |}) {
    const { mainRPCURL: mainRPCURLIn, testRPCURL: testRPCURLIn, options } =
      input || {};
    this._networks$ = new BehaviorSubject([]);
    this.networks$ = this._networks$;
    this._providers = {};

    let hasMain = false;
    let hasTest = false;
    const networks = (options || []).map(({ network, rpcURL }) => {
      if (network === networkConfigs.MAIN) {
        hasMain = true;
      }

      if (network === networkConfigs.TEST) {
        hasTest = true;
      }

      this._providers[network] = new NEOONEDataProvider({
        network,
        rpcURL,
      });

      return network;
    });

    if (!hasMain) {
      const mainRPCURL =
        mainRPCURLIn == null ? networkConfigs.MAIN_URL : mainRPCURLIn;
      this._providers.main = new NEOONEDataProvider({
        network: networkConfigs.MAIN,
        rpcURL: mainRPCURL,
      });
      networks.push(networkConfigs.MAIN);
    }

    if (!hasTest) {
      const testRPCURL =
        testRPCURLIn == null ? networkConfigs.TEST_URL : testRPCURLIn;
      this._providers.test = new NEOONEDataProvider({
        network: networkConfigs.TEST,
        rpcURL: testRPCURL,
      });
      networks.push(networkConfigs.TEST);
    }

    this._networks$.next(networks);
  }

  getNetworks(): Array<NetworkType> {
    return this._networks$.getValue();
  }

  addNetwork({
    network,
    rpcURL,
  }: {|
    network: NetworkType,
    rpcURL: string,
  |}): void {
    this._providers[network] = new NEOONEDataProvider({ network, rpcURL });
    const networks = this._networks$.value.filter(net => network !== net);
    networks.push(network);
    this._networks$.next(networks);
  }

  getUnclaimed(
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ): Promise<{| unclaimed: Array<Input>, amount: BigNumber |}> {
    return this._getProvider(network).getUnclaimed(address, monitor);
  }

  getUnspentOutputs(
    network: NetworkType,
    address: AddressString,
    monitor?: Monitor,
  ): Promise<Array<UnspentOutput>> {
    return this._getProvider(network).getUnspentOutputs(address, monitor);
  }

  relayTransaction(
    network: NetworkType,
    transaction: string,
    monitor?: Monitor,
  ): Promise<Transaction> {
    return this._getProvider(network).relayTransaction(transaction, monitor);
  }

  getTransactionReceipt(
    network: NetworkType,
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceipt> {
    return this._getProvider(network).getTransactionReceipt(hash, options);
  }

  getInvocationData(
    network: NetworkType,
    hash: Hash256String,
    monitor?: Monitor,
  ): Promise<RawInvocationData> {
    return this._getProvider(network).getInvocationData(hash, monitor);
  }

  testInvoke(
    network: NetworkType,
    transaction: string,
    monitor?: Monitor,
  ): Promise<RawInvocationResult> {
    return this._getProvider(network).testInvoke(transaction, monitor);
  }

  getNetworkSettings(
    network: NetworkType,
    monitor?: Monitor,
  ): Promise<NetworkSettings> {
    return this._getProvider(network).getNetworkSettings(monitor);
  }

  read(network: NetworkType): NEOONEDataProvider {
    return this._getProvider(network);
  }

  _getProvider(network: NetworkType): NEOONEDataProvider {
    const provider = this._providers[network];
    if (provider == null) {
      throw new UnknownNetworkError(network);
    }

    return provider;
  }
}
