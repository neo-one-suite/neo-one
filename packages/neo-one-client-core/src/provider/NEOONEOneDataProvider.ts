/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  Account,
  AddressString,
  Asset,
  Block,
  Contract,
  DeveloperProvider,
  GetOptions,
  Hash256String,
  Input,
  InputOutput,
  IterOptions,
  NetworkSettings,
  NetworkType,
  Output,
  Peer,
  PrivateNetworkSettings,
  RawAction,
  RawCallReceipt,
  RawInvocationData,
  RelayTransactionResult,
  ScriptBuilderParam,
  Transaction,
  TransactionReceipt,
} from '@neo-one/client-common';
import { Client as OneClient } from '@neo-one/server-http-client';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import { flatMap } from '@reactivex/ix-es2015-cjs/asynciterable/pipe/flatmap';
import BigNumber from 'bignumber.js';
import { NEOONEOneDataProviderSetRPCURLError } from '../errors';
import { NEOONEDataProvider } from './NEOONEDataProvider';

export interface NEOONEOneDataProviderOptions {
  readonly network: NetworkType;
  readonly projectID: string;
  readonly port: number;
  readonly host?: string;
  readonly iterBlocksFetchTimeoutMS?: number;
  readonly iterBlocksBatchSize?: number;
}

/**
 * Implements the methods required by the `NEOONEProvider` as well as the `DeveloperProvider` interface using a NEO•ONE node that is looked up through the local NEO•ONE `projectID`.
 */
export class NEOONEOneDataProvider implements DeveloperProvider {
  public readonly network: NetworkType;
  private mutableProvider: NEOONEDataProvider | undefined;
  private readonly projectID: string;
  private readonly port: number;
  private readonly host: string;
  private readonly iterBlocksFetchTimeoutMS: number | undefined;
  private readonly iterBlocksBatchSize: number | undefined;

  public constructor(options: NEOONEOneDataProviderOptions) {
    const { network, projectID, port, host = 'localhost', iterBlocksFetchTimeoutMS, iterBlocksBatchSize } = options;
    this.network = network;
    this.projectID = projectID;
    this.port = port;
    this.host = host;
    this.iterBlocksFetchTimeoutMS = iterBlocksFetchTimeoutMS;
    this.iterBlocksBatchSize = iterBlocksBatchSize;
  }

  public setRPCURL(_rpcURL: string): void {
    throw new NEOONEOneDataProviderSetRPCURLError();
  }

  public async getUnclaimed(
    address: AddressString,
  ): Promise<{ readonly unclaimed: readonly Input[]; readonly amount: BigNumber }> {
    const provider = await this.getProvider();

    return provider.getUnclaimed(address);
  }

  public async getClaimAmount(input: Input): Promise<BigNumber> {
    const provider = await this.getProvider();

    return provider.getClaimAmount(input);
  }

  public async getUnspentOutputs(address: AddressString): Promise<readonly InputOutput[]> {
    const provider = await this.getProvider();

    return provider.getUnspentOutputs(address);
  }

  public async relayTransaction(transaction: string): Promise<RelayTransactionResult> {
    const provider = await this.getProvider();

    return provider.relayTransaction(transaction);
  }

  public async getTransactionReceipt(hash: Hash256String, options?: GetOptions): Promise<TransactionReceipt> {
    const provider = await this.getProvider();

    return provider.getTransactionReceipt(hash, options);
  }

  public async getInvocationData(hash: Hash256String): Promise<RawInvocationData> {
    const provider = await this.getProvider();

    return provider.getInvocationData(hash);
  }

  public async testInvoke(transaction: string): Promise<RawCallReceipt> {
    const provider = await this.getProvider();

    return provider.testInvoke(transaction);
  }

  public async getAccount(address: AddressString): Promise<Account> {
    const provider = await this.getProvider();

    return provider.getAccount(address);
  }

  public async getAsset(hash: Hash256String): Promise<Asset> {
    const provider = await this.getProvider();

    return provider.getAsset(hash);
  }

  public async getBlock(hashOrIndex: Hash256String | number, options?: GetOptions): Promise<Block> {
    const provider = await this.getProvider();

    return provider.getBlock(hashOrIndex, options);
  }

  public iterBlocks(options: IterOptions = {}): AsyncIterable<Block> {
    return AsyncIterableX.from(this.getProvider()).pipe<Block>(flatMap((provider) => provider.iterBlocks(options)));
  }

  public async getBestBlockHash(): Promise<Hash256String> {
    const provider = await this.getProvider();

    return provider.getBestBlockHash();
  }

  public async getBlockCount(): Promise<number> {
    const provider = await this.getProvider();

    return provider.getBlockCount();
  }

  public async getContract(address: AddressString): Promise<Contract> {
    const provider = await this.getProvider();

    return provider.getContract(address);
  }

  public async getMemPool(): Promise<readonly Hash256String[]> {
    const provider = await this.getProvider();

    return provider.getMemPool();
  }

  public async getTransaction(hash: Hash256String): Promise<Transaction> {
    const provider = await this.getProvider();

    return provider.getTransaction(hash);
  }

  public async getOutput(input: Input): Promise<Output> {
    const provider = await this.getProvider();

    return provider.getOutput(input);
  }

  public async getConnectedPeers(): Promise<readonly Peer[]> {
    const provider = await this.getProvider();

    return provider.getConnectedPeers();
  }

  public async getNetworkSettings(): Promise<NetworkSettings> {
    const provider = await this.getProvider();

    return provider.getNetworkSettings();
  }

  public iterActionsRaw(options: IterOptions = {}): AsyncIterable<RawAction> {
    return AsyncIterableX.from(this.getProvider()).pipe<RawAction>(
      flatMap((provider) => provider.iterActionsRaw(options)),
    );
  }

  public async call(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
  ): Promise<RawCallReceipt> {
    const provider = await this.getProvider();

    return provider.call(contract, method, params);
  }

  public async runConsensusNow(): Promise<void> {
    const provider = await this.getProvider();

    return provider.runConsensusNow();
  }

  public async updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void> {
    const provider = await this.getProvider();

    return provider.updateSettings(options);
  }

  public async getSettings(): Promise<PrivateNetworkSettings> {
    const provider = await this.getProvider();

    return provider.getSettings();
  }

  public async fastForwardOffset(seconds: number): Promise<void> {
    const provider = await this.getProvider();

    return provider.fastForwardOffset(seconds);
  }

  public async fastForwardToTime(seconds: number): Promise<void> {
    const provider = await this.getProvider();

    return provider.fastForwardToTime(seconds);
  }

  public async reset(): Promise<void> {
    const provider = await this.getProvider();

    return provider.reset();
  }

  private async getProvider(): Promise<NEOONEDataProvider> {
    /* istanbul ignore next */
    if (this.mutableProvider === undefined) {
      const client = new OneClient(this.port, this.host);
      const result = await client.request({
        plugin: '@neo-one/server-plugin-project',
        options: { type: 'network', projectID: this.projectID },
      });
      this.mutableProvider = new NEOONEDataProvider({
        network: this.network,
        rpcURL: result.response.nodes[0].rpcAddress.replace('localhost', this.host),
        iterBlocksFetchTimeoutMS: this.iterBlocksFetchTimeoutMS,
        iterBlocksBatchSize: this.iterBlocksBatchSize,
      });
    }

    return this.mutableProvider;
  }
}
