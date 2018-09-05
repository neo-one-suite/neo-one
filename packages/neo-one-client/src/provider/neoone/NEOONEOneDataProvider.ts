import { ScriptBuilderParam } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import { Client as OneClient } from '@neo-one/server-http-client';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { flatMap } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatmap';
import BigNumber from 'bignumber.js';
import {
  Account,
  AddressString,
  Asset,
  Block,
  BlockFilter,
  BufferString,
  Contract,
  DataProvider,
  DeveloperProvider,
  GetOptions,
  Hash256String,
  Input,
  InputOutput,
  NetworkSettings,
  NetworkType,
  Output,
  Peer,
  PrivateNetworkSettings,
  RawAction,
  RawCallReceipt,
  RawInvocationData,
  RelayTransactionResult,
  StorageItem,
  Transaction,
  TransactionReceipt,
} from '../../types';
import { NEOONEDataProvider } from './NEOONEDataProvider';

export interface NEOONEOneDataProviderOptions {
  readonly network: NetworkType;
  readonly projectID: string;
  readonly port: number;
  readonly iterBlocksFetchTimeoutMS?: number;
  readonly iterBlocksBatchSize?: number;
}

export class NEOONEOneDataProvider implements DataProvider, DeveloperProvider {
  public readonly network: NetworkType;
  private mutableProvider: NEOONEDataProvider | undefined;
  private readonly projectID: string;
  private readonly port: number;
  private readonly iterBlocksFetchTimeoutMS: number | undefined;
  private readonly iterBlocksBatchSize: number | undefined;

  public constructor({
    network,
    projectID,
    port,
    iterBlocksFetchTimeoutMS,
    iterBlocksBatchSize,
  }: NEOONEOneDataProviderOptions) {
    this.network = network;
    this.projectID = projectID;
    this.port = port;
    this.iterBlocksFetchTimeoutMS = iterBlocksFetchTimeoutMS;
    this.iterBlocksBatchSize = iterBlocksBatchSize;
  }

  public setRPCURL(_rpcURL: string): void {
    throw new Error('Cannot set rpcURL for NEOONEOneDataProvider');
  }

  public async getUnclaimed(
    address: AddressString,
    monitor?: Monitor,
  ): Promise<{ readonly unclaimed: ReadonlyArray<Input>; readonly amount: BigNumber }> {
    const provider = await this.getProvider();

    return provider.getUnclaimed(address, monitor);
  }

  public async getClaimAmount(input: Input, monitor?: Monitor): Promise<BigNumber> {
    const provider = await this.getProvider();

    return provider.getClaimAmount(input, monitor);
  }

  public async getUnspentOutputs(address: AddressString, monitor?: Monitor): Promise<ReadonlyArray<InputOutput>> {
    const provider = await this.getProvider();

    return provider.getUnspentOutputs(address, monitor);
  }

  public async relayTransaction(transaction: string, monitor?: Monitor): Promise<RelayTransactionResult> {
    const provider = await this.getProvider();

    return provider.relayTransaction(transaction, monitor);
  }

  public async getTransactionReceipt(hash: Hash256String, options?: GetOptions): Promise<TransactionReceipt> {
    const provider = await this.getProvider();

    return provider.getTransactionReceipt(hash, options);
  }

  public async getInvocationData(hash: Hash256String, monitor?: Monitor): Promise<RawInvocationData> {
    const provider = await this.getProvider();

    return provider.getInvocationData(hash, monitor);
  }

  public async testInvoke(transaction: string, monitor?: Monitor): Promise<RawCallReceipt> {
    const provider = await this.getProvider();

    return provider.testInvoke(transaction, monitor);
  }

  public async getAccount(address: AddressString, monitor?: Monitor): Promise<Account> {
    const provider = await this.getProvider();

    return provider.getAccount(address, monitor);
  }

  public async getAsset(hash: Hash256String, monitor?: Monitor): Promise<Asset> {
    const provider = await this.getProvider();

    return provider.getAsset(hash, monitor);
  }

  public async getBlock(hashOrIndex: Hash256String | number, options?: GetOptions): Promise<Block> {
    const provider = await this.getProvider();

    return provider.getBlock(hashOrIndex, options);
  }

  public iterBlocks(filter: BlockFilter = {}): AsyncIterable<Block> {
    return AsyncIterableX.from(this.getProvider()).pipe(flatMap((provider) => provider.iterBlocks(filter)));
  }

  public async getBestBlockHash(monitor?: Monitor): Promise<Hash256String> {
    const provider = await this.getProvider();

    return provider.getBestBlockHash(monitor);
  }

  public async getBlockCount(monitor?: Monitor): Promise<number> {
    const provider = await this.getProvider();

    return provider.getBlockCount(monitor);
  }

  public async getContract(address: AddressString, monitor?: Monitor): Promise<Contract> {
    const provider = await this.getProvider();

    return provider.getContract(address, monitor);
  }

  public async getMemPool(monitor?: Monitor): Promise<ReadonlyArray<Hash256String>> {
    const provider = await this.getProvider();

    return provider.getMemPool(monitor);
  }

  public async getTransaction(hash: Hash256String, monitor?: Monitor): Promise<Transaction> {
    const provider = await this.getProvider();

    return provider.getTransaction(hash, monitor);
  }

  public async getOutput(input: Input, monitor?: Monitor): Promise<Output> {
    const provider = await this.getProvider();

    return provider.getOutput(input, monitor);
  }

  public async getConnectedPeers(monitor?: Monitor): Promise<ReadonlyArray<Peer>> {
    const provider = await this.getProvider();

    return provider.getConnectedPeers(monitor);
  }

  public async getNetworkSettings(monitor?: Monitor): Promise<NetworkSettings> {
    const provider = await this.getProvider();

    return provider.getNetworkSettings(monitor);
  }

  public async getStorage(address: AddressString, key: BufferString, monitor?: Monitor): Promise<StorageItem> {
    const provider = await this.getProvider();

    return provider.getStorage(address, key, monitor);
  }

  public iterStorage(address: AddressString, monitor?: Monitor): AsyncIterable<StorageItem> {
    return AsyncIterableX.from(this.getProvider()).pipe(flatMap((provider) => provider.iterStorage(address, monitor)));
  }

  public iterActionsRaw(filter: BlockFilter = {}): AsyncIterable<RawAction> {
    return AsyncIterableX.from(this.getProvider()).pipe(flatMap((provider) => provider.iterActionsRaw(filter)));
  }

  public async call(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ): Promise<RawCallReceipt> {
    const provider = await this.getProvider();

    return provider.call(contract, method, params, monitor);
  }

  public async runConsensusNow(monitor?: Monitor): Promise<void> {
    const provider = await this.getProvider();

    return provider.runConsensusNow(monitor);
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>, monitor?: Monitor): Promise<void> {
    const provider = await this.getProvider();

    return provider.updateSettings(options, monitor);
  }

  public async getSettings(monitor?: Monitor): Promise<PrivateNetworkSettings> {
    const provider = await this.getProvider();

    return provider.getSettings(monitor);
  }

  public async fastForwardOffset(seconds: number, monitor?: Monitor): Promise<void> {
    const provider = await this.getProvider();

    return provider.fastForwardOffset(seconds, monitor);
  }

  public async fastForwardToTime(seconds: number, monitor?: Monitor): Promise<void> {
    const provider = await this.getProvider();

    return provider.fastForwardToTime(seconds, monitor);
  }

  public async reset(monitor?: Monitor): Promise<void> {
    const provider = await this.getProvider();

    return provider.reset(monitor);
  }

  private async getProvider(): Promise<NEOONEDataProvider> {
    if (this.mutableProvider === undefined) {
      const client = new OneClient(this.port);
      const result = await client.request({
        plugin: '@neo-one/server-plugin-project',
        options: { type: 'network', projectID: this.projectID },
      });
      this.mutableProvider = new NEOONEDataProvider({
        network: this.network,
        rpcURL: result.response.nodes[0].rpcAddress,
        iterBlocksFetchTimeoutMS: this.iterBlocksFetchTimeoutMS,
        iterBlocksBatchSize: this.iterBlocksBatchSize,
      });
    }

    return this.mutableProvider;
  }
}
