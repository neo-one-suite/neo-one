/* @flow */
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import type BigNumber from 'bignumber.js';
import type { Observable } from 'rxjs/Observable';

import type {
  AddressString,
  GetOptions,
  Hash256String,
  Input,
  RawInvocationData,
  RawInvocationResult,
  Network,
  Transaction,
  TransactionReceipt,
  UnspentOutput,
} from '../../types'; // eslint-disable-line
import NEOONEDataProvider from './NEOONEDataProvider';
import { UnknownNetworkError } from '../../errors';

import * as networkConfigs from '../../networks';

export type ProviderOptions = {|
  network: Network,
  rpcURL: string,
|};

export default class NEOONEProvider {
  networks$: Observable<Array<Network>>;
  _networks$: BehaviorSubject<Array<Network>>;

  _providers: { [type: string]: NEOONEDataProvider };

  constructor({
    mainRPCURL: mainRPCURLIn,
    testRPCURL: testRPCURLIn,
    options,
  }: {|
    mainRPCURL?: string,
    testRPCURL?: string,
    options?: Array<ProviderOptions>,
  |}) {
    this._networks$ = new BehaviorSubject([]);
    this.networks$ = this._networks$;
    this._providers = {};

    let hasMain = false;
    let hasTest = false;
    const networks = (options || []).map(({ network, rpcURL }) => {
      if (network.type === networkConfigs.MAIN.type) {
        hasMain = true;
      }

      if (network.type === networkConfigs.TEST.type) {
        hasTest = true;
      }

      this._providers[network.type] = new NEOONEDataProvider({
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

  addNetwork({
    network,
    rpcURL,
  }: {|
    network: Network,
    rpcURL: string,
  |}): void {
    this._providers[network.type] = new NEOONEDataProvider({
      network,
      rpcURL,
    });
    if (
      !this._networks$.value.some(net => networkConfigs.isEqual(network, net))
    ) {
      const networks = this._networks$.value.filter(
        net => network.type !== net.type,
      );
      networks.push(network);
      this._networks$.next(networks);
    }
  }

  getUnclaimed(
    network: Network,
    address: AddressString,
  ): Promise<{| unclaimed: Array<Input>, amount: BigNumber |}> {
    return this._getProvider(network).getUnclaimed(address);
  }

  getUnspentOutputs(
    network: Network,
    address: AddressString,
  ): Promise<Array<UnspentOutput>> {
    return this._getProvider(network).getUnspentOutputs(address);
  }

  relayTransaction(
    network: Network,
    transaction: string,
  ): Promise<Transaction> {
    return this._getProvider(network).relayTransaction(transaction);
  }

  getTransactionReceipt(
    network: Network,
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceipt> {
    return this._getProvider(network).getTransactionReceipt(hash, options);
  }

  getInvocationData(
    network: Network,
    hash: Hash256String,
  ): Promise<RawInvocationData> {
    return this._getProvider(network).getInvocationData(hash);
  }

  testInvoke(
    network: Network,
    transaction: string,
  ): Promise<RawInvocationResult> {
    return this._getProvider(network).testInvoke(transaction);
  }

  _getProvider(network: Network): NEOONEDataProvider {
    const provider = this._providers[network.type];
    if (provider == null) {
      throw new UnknownNetworkError(network.type);
    }

    return provider;
  }
}
