import {
  Account,
  AddressString,
  Asset,
  Block,
  Contract,
  GetOptions,
  Hash256String,
  Input,
  IterOptions,
  Output,
  Peer,
  Transaction,
} from '@neo-one/client-common';
import { args as clientArgs } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import * as args from './args';
import { DataProvider } from './types';

export class ReadClient<TDataProvider extends DataProvider = DataProvider> {
  public readonly dataProvider: TDataProvider;

  public constructor(dataProvider: TDataProvider) {
    this.dataProvider = dataProvider;
  }

  public async getAccount(address: AddressString, monitor?: Monitor): Promise<Account> {
    return this.dataProvider.getAccount(clientArgs.assertAddress('address', address), monitor);
  }

  public async getAsset(hash: Hash256String, monitor?: Monitor): Promise<Asset> {
    return this.dataProvider.getAsset(clientArgs.assertHash256('hash', hash), monitor);
  }

  public async getBlock(hash: number | Hash256String, optionsIn?: GetOptions): Promise<Block> {
    const options = args.assertGetOptions('options', optionsIn);
    if (typeof hash === 'number') {
      return this.dataProvider.getBlock(hash, options);
    }

    return this.dataProvider.getBlock(clientArgs.assertHash256('hash', hash), options);
  }

  public iterBlocks(options?: IterOptions): AsyncIterable<Block> {
    return this.dataProvider.iterBlocks(args.assertIterOptions('options', options));
  }

  public async getBestBlockHash(monitor?: Monitor): Promise<Hash256String> {
    return this.dataProvider.getBestBlockHash(monitor);
  }

  public async getBlockCount(monitor?: Monitor): Promise<number> {
    return this.dataProvider.getBlockCount(monitor);
  }

  public async getContract(address: AddressString, monitor?: Monitor): Promise<Contract> {
    return this.dataProvider.getContract(clientArgs.assertAddress('address', address), monitor);
  }

  public async getMemPool(monitor?: Monitor): Promise<readonly Hash256String[]> {
    return this.dataProvider.getMemPool(monitor);
  }

  public async getTransaction(hash: Hash256String, monitor?: Monitor): Promise<Transaction> {
    return this.dataProvider.getTransaction(clientArgs.assertHash256('hash', hash), monitor);
  }

  public async getOutput(input: Input, monitor?: Monitor): Promise<Output> {
    return this.dataProvider.getOutput(input, monitor);
  }

  public async getConnectedPeers(monitor?: Monitor): Promise<readonly Peer[]> {
    return this.dataProvider.getConnectedPeers(monitor);
  }
}
