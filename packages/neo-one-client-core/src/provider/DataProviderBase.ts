/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  Account,
  AccountJSON,
  AddressString,
  Asset,
  Block,
  BlockJSON,
  common,
  ConfirmedTransaction,
  Contract,
  GetOptions,
  Hash256String,
  Input,
  InputOutput,
  InvocationTransactionModel,
  IterOptions,
  NetworkSettings,
  NetworkType,
  Output,
  Peer,
  RawAction,
  RawCallReceipt,
  RawInvocationData,
  RelayTransactionResult,
  ScriptBuilderParam,
  StorageItem,
  Transaction,
  TransactionBaseModel,
  TransactionJSON,
  TransactionReceipt,
} from '@neo-one/client-common';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import BigNumber from 'bignumber.js';
import debug from 'debug';
import { AsyncBlockIterator } from '../AsyncBlockIterator';
import { clientUtils } from '../clientUtils';
import { NeoNotImplementedError } from '../errors';
import { convertAsset, convertBlock, convertContract, convertTransaction } from './convert';
import { JSONRPCClient } from './JSONRPCClient';
import { JSONRPCHTTPProvider } from './JSONRPCHTTPProvider';
import { JSONRPCProvider, JSONRPCProviderManager } from './JSONRPCProvider';

const logger = debug('NEOONE:DataProvider');

export interface DataProviderOptions {
  readonly network: NetworkType;
  readonly rpcURL: string | JSONRPCProvider | JSONRPCProviderManager;
  readonly iterBlocksFetchTimeoutMS?: number;
  readonly iterBlocksBatchSize?: number;
}

export interface DataProvider {
  readonly setRPCURL: (rpcURL: string) => void;
  readonly getUnclaimed: (
    address: AddressString,
  ) => Promise<{ readonly unclaimed: readonly Input[]; readonly amount: BigNumber }>;
  readonly getClaimAmount: (input: Input) => Promise<BigNumber>;
  readonly getUnspentOutputs: (address: AddressString) => Promise<readonly InputOutput[]>;
  readonly relayTransaction: (
    transaction: TransactionBaseModel,
    networkFee?: BigNumber,
  ) => Promise<RelayTransactionResult>;
  readonly getTransactionReceipt: (hash: Hash256String, options?: GetOptions) => Promise<TransactionReceipt>;
  readonly getInvocationData: (hash: Hash256String) => Promise<RawInvocationData>;
  readonly testInvoke: (transaction: InvocationTransactionModel) => Promise<RawCallReceipt>;
  readonly getAccount: (address: AddressString) => Promise<Account>;
  readonly getAsset: (hash: Hash256String) => Promise<Asset>;
  readonly getBlock: (hashOrIndex: Hash256String | number, options?: GetOptions) => Promise<Block>;
  readonly iterBlocks: (options: IterOptions) => AsyncIterable<Block>;
  readonly getBestBlockHash: () => Promise<Hash256String>;
  readonly getBlockCount: () => Promise<number>;
  readonly getContract: (address: AddressString) => Promise<Contract>;
  readonly getMemPool: () => Promise<readonly Hash256String[]>;
  readonly getTransaction: (hash: Hash256String) => Promise<Transaction>;
  readonly getOutput: (input: Input) => Promise<Output>;
  readonly getConnectedPeers: () => Promise<readonly Peer[]>;
  readonly getNetworkSettings: () => Promise<NetworkSettings>;
  readonly iterActionsRaw: (options: IterOptions) => AsyncIterable<RawAction>;
  readonly call: (
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ) => Promise<RawCallReceipt>;
  readonly iterStorage: (address: AddressString) => AsyncIterable<StorageItem>;
}

/**
 * Implements the methods required by the `NEOONEProvider`.
 */
export abstract class DataProviderBase implements DataProvider {
  public readonly network: NetworkType;
  protected mutableClient: JSONRPCClient;
  protected readonly iterBlocksFetchTimeoutMS: number | undefined;
  protected readonly iterBlocksBatchSize: number | undefined;

  public constructor({ network, rpcURL, iterBlocksFetchTimeoutMS, iterBlocksBatchSize }: DataProviderOptions) {
    this.network = network;
    this.mutableClient = new JSONRPCClient(typeof rpcURL === 'string' ? new JSONRPCHTTPProvider(rpcURL) : rpcURL);
    this.iterBlocksFetchTimeoutMS = iterBlocksFetchTimeoutMS;
    this.iterBlocksBatchSize = iterBlocksBatchSize;
  }

  public setRPCURL(rpcURL: string): void {
    this.mutableClient = new JSONRPCClient(new JSONRPCHTTPProvider(rpcURL));
  }

  public async getUnclaimed(
    address: AddressString,
  ): Promise<{ readonly unclaimed: readonly Input[]; readonly amount: BigNumber }> {
    return this.capture(async () => this.executeGetUnclaimed(address), 'neo_get_unclaimed');
  }

  public async getClaimAmount(_input: Input): Promise<BigNumber> {
    throw new NeoNotImplementedError('getClaimAmount');
  }

  public async getUnspentOutputs(address: AddressString): Promise<readonly InputOutput[]> {
    return this.capture(async () => this.executeGetUnspentOutputs(address), 'neo_get_unspent');
  }

  public async relayTransaction(
    transaction: TransactionBaseModel,
    networkFee?: BigNumber,
  ): Promise<RelayTransactionResult> {
    return this.executeRelayTransaction(transaction, networkFee);
  }

  public async relayStrippedTransaction(
    verificationTransaction: InvocationTransactionModel,
    relayTransaction: InvocationTransactionModel,
    networkFee?: BigNumber,
  ): Promise<RelayTransactionResult> {
    return this.executeRelayStrippedTransaction(verificationTransaction, relayTransaction, networkFee);
  }

  public async getTransactionReceipt(hash: Hash256String, options?: GetOptions): Promise<TransactionReceipt> {
    return this.executeGetTransactionReceipt(hash, options);
  }

  public async getInvocationData(_hash: Hash256String): Promise<RawInvocationData> {
    throw new NeoNotImplementedError('getInvocationData');
  }

  public async testInvoke(transaction: InvocationTransactionModel): Promise<RawCallReceipt> {
    return this.executeTestInvoke(transaction);
  }

  public async getAccount(address: AddressString): Promise<Account> {
    const account = await this.getAccountInternal(address);

    return {
      address,
      balances: account.balances.reduce<Account['balances']>(
        (acc, { asset, value }) => ({
          ...acc,
          [asset]: new BigNumber(value),
        }),
        {},
      ),
    };
  }

  public async getAsset(hash: Hash256String): Promise<Asset> {
    const asset = await this.mutableClient.getAsset(hash);

    return convertAsset(asset);
  }

  public async getBlock(hashOrIndex: Hash256String | number, options?: GetOptions): Promise<Block> {
    const block = await this.mutableClient.getBlock(hashOrIndex, options);

    return convertBlock(block, this.convertConfirmedTransaction);
  }

  public iterBlocks(options: IterOptions = {}): AsyncIterable<Block> {
    return AsyncIterableX.from(
      new AsyncBlockIterator({
        client: this,
        options,
        fetchTimeoutMS: this.iterBlocksFetchTimeoutMS,
        batchSize: this.iterBlocksBatchSize,
      }),
    );
  }

  public async getBestBlockHash(): Promise<Hash256String> {
    return this.mutableClient.getBestBlockHash();
  }

  public async getBlockCount(): Promise<number> {
    return this.mutableClient.getBlockCount();
  }

  public async getContract(address: AddressString): Promise<Contract> {
    const contract = await this.mutableClient.getContract(address);

    return convertContract(contract);
  }

  public async getMemPool(): Promise<readonly Hash256String[]> {
    return this.mutableClient.getMemPool();
  }

  public async getTransaction(hash: Hash256String): Promise<Transaction> {
    const transaction = await this.mutableClient.getTransaction(hash);

    return convertTransaction(transaction);
  }

  public async getOutput(input: Input): Promise<Output> {
    return this.executeGetOutput(input);
  }

  public async getConnectedPeers(): Promise<readonly Peer[]> {
    return this.mutableClient.getConnectedPeers();
  }

  public async getNetworkSettings(): Promise<NetworkSettings> {
    throw new NeoNotImplementedError('getNetworkSettings');
  }

  public iterActionsRaw(_options: IterOptions = {}): AsyncIterable<RawAction> {
    throw new NeoNotImplementedError('iterActionsRaw');
  }

  public async call(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ): Promise<RawCallReceipt> {
    const testTransaction = new InvocationTransactionModel({
      version: 1,
      gas: common.TEN_THOUSAND_FIXED8,
      script: clientUtils.getInvokeMethodScript({
        address: contract,
        method,
        params,
      }),
    });

    return this.testInvoke(testTransaction);
  }

  public iterStorage(_address: AddressString): AsyncIterable<StorageItem> {
    throw new NeoNotImplementedError('iterStorage');
  }

  protected async getAccountInternal(address: AddressString): Promise<AccountJSON> {
    return this.executeGetAccountInternal(address);
  }

  protected abstract async executeGetUnclaimed(
    address: AddressString,
  ): Promise<{ readonly unclaimed: readonly Input[]; readonly amount: BigNumber }>;

  protected abstract async executeGetUnspentOutputs(address: AddressString): Promise<readonly InputOutput[]>;

  protected abstract async executeRelayTransaction(
    transaction: TransactionBaseModel,
    networkFee?: BigNumber,
  ): Promise<RelayTransactionResult>;

  protected abstract async executeRelayStrippedTransaction(
    verificationTransaction: InvocationTransactionModel,
    relayTransaction: InvocationTransactionModel,
    networkFee?: BigNumber,
  ): Promise<RelayTransactionResult>;

  protected abstract async executeGetTransactionReceipt(
    hash: Hash256String,
    options?: GetOptions,
  ): Promise<TransactionReceipt>;

  protected abstract async executeTestInvoke(transaction: InvocationTransactionModel): Promise<RawCallReceipt>;

  protected abstract async executeGetOutput(input: Input): Promise<Output>;

  protected abstract async executeGetAccountInternal(address: AddressString): Promise<AccountJSON>;

  protected abstract convertConfirmedTransaction(transaction: TransactionJSON, block: BlockJSON): ConfirmedTransaction;

  protected async capture<T>(func: () => Promise<T>, title: string): Promise<T> {
    try {
      const result = await func();
      logger('%o', { level: 'debug', title });

      return result;
    } catch (error) {
      logger('%o', { level: 'error', title, error: error.message });
      throw error;
    }
  }
}
