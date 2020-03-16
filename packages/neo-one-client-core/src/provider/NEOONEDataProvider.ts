/// <reference types="@reactivex/ix-es2015-cjs" />
import {
  AddressString,
  Block,
  BufferString,
  ConfirmedTransaction,
  Contract,
  ContractParameterJSON,
  GetOptions,
  Hash256String,
  IterOptions,
  NetworkType,
  Peer,
  RawInvocationResult,
  RelayTransactionResult,
} from '@neo-one/client-common';
import { AsyncIterableX } from '@reactivex/ix-es2015-cjs/asynciterable/asynciterablex';
import debug from 'debug';
import { AsyncBlockIterator } from '../AsyncBlockIterator';
import {
  convertBlock,
  convertConfirmedTransaction,
  convertContract,
  convertInvocationResult,
  convertRelayTransactionResult,
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
export class NEOONEDataProvider {
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

  public async sendTransaction(transaction: string): Promise<RelayTransactionResult> {
    const result = await this.mutableClient.sendTransaction(transaction);

    return convertRelayTransactionResult(result);
  }

  public async getTransaction(hash: Hash256String, options?: GetOptions): Promise<ConfirmedTransaction> {
    const result = await this.mutableClient.getTransaction(hash, options);

    return convertConfirmedTransaction(result);
  }

  public async invokeFunction(
    contract: AddressString,
    method: string,
    args: readonly ContractParameterJSON[],
  ): Promise<RawInvocationResult> {
    const receipt = await this.mutableClient.invokeFunction(contract, method, args);

    return convertInvocationResult(receipt);
  }

  public async invokeRawScript(script: BufferString): Promise<RawInvocationResult> {
    const receipt = await this.mutableClient.invokeScript(script);

    return convertInvocationResult(receipt);
  }

  public async getBlock(hashOrIndex: Hash256String | number, options?: GetOptions): Promise<Block> {
    const block = await this.mutableClient.getBlock(hashOrIndex, options);

    return convertBlock(block);
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

  public async getConnectedPeers(): Promise<readonly Peer[]> {
    return this.mutableClient.getConnectedPeers();
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

  // public async getNetworkSettings(): Promise<NetworkSettings> {
  //   const settings = await this.mutableClient.getNetworkSettings();

  //   return this.convertNetworkSettings(settings);
  // }

  // public iterActionsRaw(options: IterOptions = {}): AsyncIterable<RawAction> {
  //   return AsyncIterableX.from(this.iterBlocks(options)).pipe<RawAction>(
  //     flatMap(async (block) => {
  //       const actions = _.flatten(
  //         block.transactions.map((transaction) => {
  //           if (transaction.type === 'InvocationTransaction') {
  //             return [...transaction.invocationData.actions];
  //           }

  //           return [];
  //         }),
  //       );

  //       return AsyncIterableX.of(...actions);
  //     }),
  //   );
  // }

  // public async runConsensusNow(): Promise<void> {
  //   return this.mutableClient.runConsensusNow();
  // }

  // public async updateSettings(options: Partial<PrivateNetworkSettings>): Promise<void> {
  //   return this.mutableClient.updateSettings(options);
  // }

  // public async getSettings(): Promise<PrivateNetworkSettings> {
  //   return this.mutableClient.getSettings();
  // }

  // public async fastForwardOffset(seconds: number): Promise<void> {
  //   return this.mutableClient.fastForwardOffset(seconds);
  // }

  // public async fastForwardToTime(seconds: number): Promise<void> {
  //   return this.mutableClient.fastForwardToTime(seconds);
  // }

  // public async reset(): Promise<void> {
  //   return this.mutableClient.reset();
  // }

  // public async getNEOTrackerURL(): Promise<string | undefined> {
  //   return this.mutableClient.getNEOTrackerURL();
  // }

  // public async resetProject(): Promise<void> {
  //   return this.mutableClient.resetProject();
  // }

  // public iterStorage(address: AddressString): AsyncIterable<StorageItem> {
  //   return AsyncIterableX.from(this.mutableClient.getAllStorage(address).then((res) => AsyncIterableX.from(res))).pipe(
  //     // tslint:disable-next-line no-any
  //     flatten<StorageItem>() as any,
  //     map<StorageItemJSON, StorageItem>((storageItem) => this.convertStorageItem(storageItem)),
  //   );
  // }
}
