/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  Account,
  AddressString,
  Block,
  Contract,
  DeveloperProvider,
  GetOptions,
  Hash256String,
  IterOptions,
  NetworkSettings,
  NetworkType,
  Peer,
  PrivateNetworkSettings,
  RawApplicationLogData,
  RawCallReceipt,
  RawTransactionData,
  RelayTransactionResult,
  ScriptBuilderParam,
  StorageItem,
  StorageItemJSON,
  Transaction,
  TransactionModel,
  TransactionReceipt,
  TriggerTypeJSON,
  UInt160Hex,
} from '@neo-one/client-common';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { flatten } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatten';
import { map } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/map';
import BigNumber from 'bignumber.js';
import debug from 'debug';
import { AsyncBlockIterator } from '../AsyncBlockIterator';
import { clientUtils } from '../clientUtils';
import {
  convertApplicationLogData,
  convertBlock,
  convertCallReceipt,
  convertContract,
  convertNetworkSettings,
  convertRelayTransactionResult,
  convertStorageItem,
  convertTransaction,
  convertTransactionData,
} from './convert';
import { JSONRPCClient } from './JSONRPCClient';
import { JSONRPCHTTPProvider } from './JSONRPCHTTPProvider';
import { JSONRPCProvider, JSONRPCProviderManager } from './JSONRPCProvider';

const logger = debug('NEOONE:DataProvider');

export interface NEOONEDataProviderOptions {
  readonly network: NetworkType;
  readonly rpcURL: string | JSONRPCProvider | JSONRPCProviderManager;
  readonly iterBlocksFetchTimeoutMS?: number;
  readonly iterBlocksBatchSize?: number;
}

/**
 * Implements the methods required by the `NEOONEProvider` as well as the `DeveloperProvider` interface using a NEO•ONE node.
 */
export class NEOONEDataProvider implements DeveloperProvider {
  public readonly network: NetworkType;
  private mutableClient: JSONRPCClient;
  private readonly iterBlocksFetchTimeoutMS: number | undefined;
  private readonly iterBlocksBatchSize: number | undefined;

  public constructor({ network, rpcURL, iterBlocksFetchTimeoutMS, iterBlocksBatchSize }: NEOONEDataProviderOptions) {
    this.network = network;
    this.mutableClient = new JSONRPCClient(typeof rpcURL === 'string' ? new JSONRPCHTTPProvider(rpcURL) : rpcURL);
    this.iterBlocksFetchTimeoutMS = iterBlocksFetchTimeoutMS;
    this.iterBlocksBatchSize = iterBlocksBatchSize;
  }

  public setRPCURL(rpcURL: string): void {
    this.mutableClient = new JSONRPCClient(new JSONRPCHTTPProvider(rpcURL));
  }

  public async getUnclaimed(address: AddressString): Promise<BigNumber> {
    return this.capture(async () => {
      const result = await this.mutableClient.getUnclaimedGas(address);

      return new BigNumber(result.unclaimed);
    }, 'neo_get_unclaimed');
  }

  public async relayTransaction(transaction: TransactionModel): Promise<RelayTransactionResult> {
    const result = await this.mutableClient.relayTransaction(transaction.serializeWire().toString('hex'));

    return convertRelayTransactionResult(result);
  }

  public async getTransactionReceipt(hash: Hash256String, options?: GetOptions): Promise<TransactionReceipt> {
    const result = await this.mutableClient.getTransactionReceipt(hash, options);

    return { ...result, globalIndex: new BigNumber(result.globalIndex) };
  }

  public async getApplicationLogData(
    hash: Hash256String,
    triggerType?: TriggerTypeJSON,
  ): Promise<RawApplicationLogData> {
    const applicationLogData = await this.mutableClient.getApplicationLog(hash, triggerType);

    return convertApplicationLogData(applicationLogData);
  }

  public async testInvoke(script: Buffer): Promise<RawCallReceipt> {
    const receipt = await this.mutableClient.testInvokeRaw(script.toString('base64'));

    return convertCallReceipt(receipt);
  }

  public async testTransaction(transaction: TransactionModel): Promise<RawCallReceipt> {
    const receipt = await this.mutableClient.testTransaction(transaction.serializeWire().toString('hex'));

    return convertCallReceipt(receipt);
  }

  public async getBlock(hashOrIndex: Hash256String | number, options?: GetOptions): Promise<Block> {
    const block = await this.mutableClient.getBlock(hashOrIndex, options);

    return convertBlock(block);
  }

  public async getFeePerByte(): Promise<BigNumber> {
    const feePerByte = await this.mutableClient.getFeePerByte();

    return new BigNumber(feePerByte);
  }

  public async getExecFeeFactor(): Promise<number> {
    return this.mutableClient.getExecFeeFactor();
  }

  public async getVerificationCost(
    hash: AddressString,
    transaction: TransactionModel,
  ): Promise<{
    readonly fee: BigNumber;
    readonly size: number;
  }> {
    const result = await this.mutableClient.getVerificationCost(hash, transaction.serializeWire().toString('hex'));

    return {
      fee: new BigNumber(result.fee),
      size: result.size,
    };
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

  public async getConnectedPeers(): Promise<readonly Peer[]> {
    return this.mutableClient.getConnectedPeers();
  }

  public async getNetworkSettings(): Promise<NetworkSettings> {
    const settings = await this.mutableClient.getNetworkSettings();

    return convertNetworkSettings(settings);
  }

  public async call(
    contract: UInt160Hex,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ): Promise<RawCallReceipt> {
    const script = clientUtils.getInvokeMethodScript({
      scriptHash: contract,
      method,
      params,
    });

    return this.testInvoke(script);
  }

  public async runConsensusNow(): Promise<void> {
    return this.mutableClient.runConsensusNow();
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void> {
    return this.mutableClient.updateSettings(options);
  }

  public async getSettings(): Promise<PrivateNetworkSettings> {
    return this.mutableClient.getSettings();
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    return this.mutableClient.fastForwardOffset(seconds);
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    return this.mutableClient.fastForwardToTime(seconds);
  }

  public async reset(): Promise<void> {
    return this.mutableClient.reset();
  }

  public async getNEOTrackerURL(): Promise<string | undefined> {
    return this.mutableClient.getNEOTrackerURL();
  }

  public async resetProject(): Promise<void> {
    return this.mutableClient.resetProject();
  }

  public iterStorage(address: AddressString): AsyncIterable<StorageItem> {
    return AsyncIterableX.from(this.mutableClient.getAllStorage(address).then((res) => AsyncIterableX.from(res))).pipe(
      // tslint:disable-next-line no-any
      flatten<StorageItem>() as any,
      map<StorageItemJSON, StorageItem>(convertStorageItem),
    );
  }

  public async getAccount(address: AddressString): Promise<Account> {
    const balances = await this.mutableClient.getNep17Balances(address);

    return {
      address,
      balances: balances.balance.reduce<Account['balances']>(
        (acc, { assethash, amount }) => ({
          ...acc,
          [assethash]: new BigNumber(amount),
        }),
        {},
      ),
    };
  }

  public async getTransactionData(hash: Hash256String): Promise<RawTransactionData> {
    const transactionData = await this.mutableClient.getTransactionData(hash);

    return convertTransactionData(transactionData, hash);
  }

  private async capture<T>(func: () => Promise<T>, title: string): Promise<T> {
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
