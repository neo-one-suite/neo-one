import { ScriptBuilderParam } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import * as args from './args';
import { createReadSmartContract } from './sc';
import {
  Account,
  AddressString,
  Asset,
  Block,
  BlockFilter,
  BufferString,
  Contract,
  DataProvider,
  GetOptions,
  Hash256String,
  Input,
  Output,
  Peer,
  RawAction,
  RawCallReceipt,
  ReadSmartContract,
  ReadSmartContractAny,
  ReadSmartContractDefinition,
  StorageItem,
  Transaction,
} from './types';

export class ReadClient<TDataProvider extends DataProvider = DataProvider> {
  public readonly dataProvider: TDataProvider;

  public constructor(dataProvider: TDataProvider) {
    this.dataProvider = dataProvider;
  }

  public async getAccount(address: AddressString, monitor?: Monitor): Promise<Account> {
    return this.dataProvider.getAccount(args.assertAddress('address', address), monitor);
  }

  public async getAsset(hash: Hash256String, monitor?: Monitor): Promise<Asset> {
    return this.dataProvider.getAsset(args.assertHash256('hash', hash), monitor);
  }

  public async getBlock(hash: number | Hash256String, optionsIn?: GetOptions): Promise<Block> {
    const options = args.assertGetOptions('options', optionsIn);
    if (typeof hash === 'number') {
      return this.dataProvider.getBlock(hash, options);
    }

    return this.dataProvider.getBlock(args.assertHash256('hash', hash), options);
  }

  public iterBlocks(filter?: BlockFilter): AsyncIterable<Block> {
    return this.dataProvider.iterBlocks(args.assertBlockFilter('filter', filter));
  }

  public async getBestBlockHash(monitor?: Monitor): Promise<Hash256String> {
    return this.dataProvider.getBestBlockHash(monitor);
  }

  public async getBlockCount(monitor?: Monitor): Promise<number> {
    return this.dataProvider.getBlockCount(monitor);
  }

  public async getContract(address: AddressString, monitor?: Monitor): Promise<Contract> {
    return this.dataProvider.getContract(args.assertAddress('address', address), monitor);
  }

  public async getMemPool(monitor?: Monitor): Promise<ReadonlyArray<Hash256String>> {
    return this.dataProvider.getMemPool(monitor);
  }

  public async getTransaction(hash: Hash256String, monitor?: Monitor): Promise<Transaction> {
    return this.dataProvider.getTransaction(args.assertHash256('hash', hash), monitor);
  }

  public async getOutput(input: Input, monitor?: Monitor): Promise<Output> {
    return this.dataProvider.getOutput(input, monitor);
  }

  public async getConnectedPeers(monitor?: Monitor): Promise<ReadonlyArray<Peer>> {
    return this.dataProvider.getConnectedPeers(monitor);
  }

  // tslint:disable-next-line no-any
  public smartContract<T extends ReadSmartContract<any> = ReadSmartContractAny>(
    definition: ReadSmartContractDefinition,
  ): T {
    return createReadSmartContract({
      definition: args.assertReadSmartContractDefinition('definition', definition),
      client: this,
      // tslint:disable-next-line no-any
    }) as any;
  }

  public async getStorage(address: AddressString, key: BufferString, monitor?: Monitor): Promise<StorageItem> {
    return this.dataProvider.getStorage(args.assertAddress('address', address), args.assertBuffer('key', key), monitor);
  }

  public iterStorage(address: AddressString, monitor?: Monitor): AsyncIterable<StorageItem> {
    return this.dataProvider.iterStorage(args.assertAddress('address', address), monitor);
  }

  public __iterActionsRaw(filter?: BlockFilter): AsyncIterable<RawAction> {
    return this.dataProvider.iterActionsRaw(args.assertBlockFilter('filter', filter));
  }

  public async __call(
    contract: AddressString,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ): Promise<RawCallReceipt> {
    return this.dataProvider.call(contract, method, params, monitor);
  }
}
