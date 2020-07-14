import {
  Account,
  AddressString,
  Block,
  GetOptions,
  Hash256String,
  Input,
  InputOutput,
  InvocationTransactionModel,
  IterOptions,
  NetworkSettings,
  NetworkType,
  Output,
  RawAction,
  RawCallReceipt,
  RawInvocationData,
  RelayTransactionResult,
  ScriptBuilderParam,
  Transaction,
  TransactionBaseModel,
  TransactionReceipt,
} from '@neo-one/client-common';
import BigNumber from 'bignumber.js';
import { BehaviorSubject, Observable } from 'rxjs';
import { UnknownNetworkError } from '../errors';
import { Provider } from '../user';
import { DataProviderBase } from './DataProviderBase';

/**
 * Implements the `Provider` interface expected by a `LocalUserAccountProvider`.
 */
export abstract class ProviderBase<TDataProvider extends DataProviderBase> implements Provider {
  public readonly networks$: Observable<readonly NetworkType[]>;
  protected readonly networksInternal$: BehaviorSubject<readonly NetworkType[]>;
  // tslint:disable-next-line readonly-keyword
  protected readonly mutableProviders: { [key: string]: TDataProvider | undefined };

  public constructor() {
    this.networksInternal$ = new BehaviorSubject<readonly NetworkType[]>([]);
    this.networks$ = this.networksInternal$;
    this.mutableProviders = {};
  }

  public getNetworks(): readonly NetworkType[] {
    return this.networksInternal$.getValue();
  }

  public addNetwork(options: { readonly network: NetworkType; readonly rpcURL: string }): void {
    const { network, rpcURL } = options;
    this.mutableProviders[network] = this.createDataProvider({ network, rpcURL });
    const networks = this.networksInternal$.value.filter((net) => network !== net).concat([network]);
    this.networksInternal$.next(networks);
  }

  public async getUnclaimed(
    network: NetworkType,
    address: AddressString,
  ): Promise<{ readonly unclaimed: readonly Input[]; readonly amount: BigNumber }> {
    return this.getProvider(network).getUnclaimed(address);
  }

  public async getUnspentOutputs(network: NetworkType, address: AddressString): Promise<readonly InputOutput[]> {
    return this.getProvider(network).getUnspentOutputs(address);
  }

  public async relayTransaction(
    network: NetworkType,
    transaction: TransactionBaseModel,
    networkFee?: BigNumber,
  ): Promise<RelayTransactionResult> {
    return this.getProvider(network).relayTransaction(transaction, networkFee);
  }

  public async relayStrippedTransaction(
    network: NetworkType,
    verificationTransaction: InvocationTransactionModel,
    relayTransaction: InvocationTransactionModel,
    networkFee?: BigNumber,
  ): Promise<RelayTransactionResult> {
    return this.getProvider(network).relayStrippedTransaction(verificationTransaction, relayTransaction, networkFee);
  }

  public async getTransactionReceipt(
    network: NetworkType,
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceipt> {
    return this.getProvider(network).getTransactionReceipt(hash, options);
  }

  public async getInvocationData(network: NetworkType, hash: Hash256String): Promise<RawInvocationData> {
    return this.getProvider(network).getInvocationData(hash);
  }

  public async testInvoke(network: NetworkType, transaction: InvocationTransactionModel): Promise<RawCallReceipt> {
    return this.getProvider(network).testInvoke(transaction);
  }

  public async call(
    network: NetworkType,
    contract: AddressString,
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

  public async getOutput(network: NetworkType, input: Input): Promise<Output> {
    return this.getProvider(network).getOutput(input);
  }

  public async getClaimAmount(network: NetworkType, input: Input): Promise<BigNumber> {
    return this.getProvider(network).getClaimAmount(input);
  }

  public read(network: NetworkType): TDataProvider {
    return this.getProvider(network);
  }

  public async getAccount(network: NetworkType, address: AddressString): Promise<Account> {
    return this.getProvider(network).getAccount(address);
  }

  public iterActionsRaw(network: NetworkType, options?: IterOptions): AsyncIterable<RawAction> {
    return this.getProvider(network).iterActionsRaw(options);
  }

  public iterBlocks(network: NetworkType, options: IterOptions = {}): AsyncIterable<Block> {
    return this.getProvider(network).iterBlocks(options);
  }

  protected abstract createDataProvider(options: {
    readonly network: NetworkType;
    readonly rpcURL: string;
  }): TDataProvider;

  private getProvider(network: NetworkType): TDataProvider {
    const provider = this.mutableProviders[network];
    if (provider === undefined) {
      throw new UnknownNetworkError(network);
    }

    return provider;
  }
}
