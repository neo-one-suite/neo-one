import {
  Account,
  AddressString,
  Block,
  Contract,
  GetOptions,
  Hash256String,
  IterOptions,
  NetworkSettings,
  NetworkType,
  RawApplicationLogData,
  RawCallReceipt,
  RawTransactionData,
  RelayTransactionResult,
  ScriptBuilderParam,
  Transaction,
  TransactionModel,
  TransactionReceipt,
  UInt160Hex,
} from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { UnknownNetworkError } from '../errors';
import { Provider } from '../user';
import { NEOONEDataProvider, NEOONEDataProviderOptions } from './NEOONEDataProvider';

/**
 * Implements the `Provider` interface expected by a `LocalUserAccountProvider` using a NEO•ONE node.
 */
export class NEOONEProvider implements Provider {
  public readonly networks$: Observable<readonly NetworkType[]>;
  private readonly networksInternal$: BehaviorSubject<readonly NetworkType[]>;
  // tslint:disable-next-line readonly-keyword
  private readonly mutableProviders: { [key: string]: NEOONEDataProvider | undefined };

  public constructor(options: ReadonlyArray<NEOONEDataProviderOptions | NEOONEDataProvider> = []) {
    this.networksInternal$ = new BehaviorSubject<readonly NetworkType[]>([]);
    this.networks$ = this.networksInternal$;
    this.mutableProviders = {};

    const networks = options.map((opts) => {
      this.mutableProviders[opts.network] = opts instanceof NEOONEDataProvider ? opts : new NEOONEDataProvider(opts);

      return opts.network;
    });

    this.networksInternal$.next(networks);
  }

  public getNetworks(): readonly NetworkType[] {
    return this.networksInternal$.getValue();
  }

  public addNetwork(options: { readonly network: NetworkType; readonly rpcURL: string }): void {
    const { network, rpcURL } = options;
    this.mutableProviders[network] = new NEOONEDataProvider({ network, rpcURL });
    const networks = this.networksInternal$.value.filter((net) => network !== net).concat([network]);
    this.networksInternal$.next(networks);
  }

  public async getUnclaimed(network: NetworkType, address: AddressString): Promise<BigNumber> {
    return this.getProvider(network).getUnclaimed(address);
  }

  public async relayTransaction(network: NetworkType, transaction: TransactionModel): Promise<RelayTransactionResult> {
    return this.getProvider(network).relayTransaction(transaction);
  }

  public async getTransactionReceipt(
    network: NetworkType,
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceipt> {
    return this.getProvider(network).getTransactionReceipt(hash, options);
  }

  public async getTransactionData(network: NetworkType, hash: Hash256String): Promise<RawTransactionData> {
    return this.getProvider(network).getTransactionData(hash);
  }

  public async getApplicationLogData(network: NetworkType, hash: Hash256String): Promise<RawApplicationLogData> {
    return this.getProvider(network).getApplicationLogData(hash);
  }

  public async testInvoke(network: NetworkType, script: Buffer): Promise<RawCallReceipt> {
    return this.getProvider(network).testInvoke(script);
  }

  public async getFeePerByte(network: NetworkType): Promise<BigNumber> {
    return this.getProvider(network).getFeePerByte();
  }

  public async getExecFeeFactor(network: NetworkType): Promise<number> {
    return this.getProvider(network).getExecFeeFactor();
  }

  public async getVerificationCost(
    network: NetworkType,
    hash: UInt160Hex,
    transaction: TransactionModel,
  ): Promise<{
    readonly fee: BigNumber;
    readonly size: number;
  }> {
    return this.getProvider(network).getVerificationCost(hash, transaction);
  }

  public async testTransaction(network: NetworkType, transaction: TransactionModel): Promise<RawCallReceipt> {
    return this.getProvider(network).testTransaction(transaction);
  }

  public async call(
    network: NetworkType,
    contract: UInt160Hex,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ): Promise<RawCallReceipt> {
    return this.getProvider(network).call(contract, method, params);
  }

  public async getNetworkSettings(network: NetworkType): Promise<NetworkSettings> {
    return this.getProvider(network).getNetworkSettings();
  }

  public async getBlockCount(network: NetworkType): Promise<number> {
    return this.getProvider(network).getBlockCount();
  }

  public async getTransaction(network: NetworkType, hash: Hash256String): Promise<Transaction> {
    return this.getProvider(network).getTransaction(hash);
  }

  public read(network: NetworkType): NEOONEDataProvider {
    return this.getProvider(network);
  }

  public async getAccount(network: NetworkType, address: AddressString): Promise<Account> {
    return this.getProvider(network).getAccount(address);
  }

  public async getContract(network: NetworkType, address: AddressString): Promise<Contract> {
    return this.getProvider(network).getContract(address);
  }

  public iterBlocks(network: NetworkType, options: IterOptions = {}): AsyncIterable<Block> {
    return this.getProvider(network).iterBlocks(options);
  }

  private getProvider(network: NetworkType): NEOONEDataProvider {
    const provider = this.mutableProviders[network];
    if (provider === undefined) {
      throw new UnknownNetworkError(network);
    }

    return provider;
  }
}
