import {
  Account,
  AddressString,
  Block,
  Contract,
  GetOptions,
  Hash256String,
  IterOptions,
  Peer,
  Transaction,
} from '@neo-one/client-common';
import { args as clientArgs } from '@neo-one/client-core';
import * as args from './args';
import { DataProvider } from './types';

export class ReadClient<TDataProvider extends DataProvider = DataProvider> {
  public readonly dataProvider: TDataProvider;

  public constructor(dataProvider: TDataProvider) {
    this.dataProvider = dataProvider;
  }

  public async getAccount(address: AddressString): Promise<Account> {
    return this.dataProvider.getAccount(clientArgs.assertAddress('address', address));
  }

  public async getBlock(hash: number | Hash256String, optionsIn?: GetOptions): Promise<Block> {
    const options = args.assertGetOptions('options', optionsIn);
    if (typeof hash === 'number') {
      return this.dataProvider.getBlock(hash, options);
    }

    return this.dataProvider.getBlock(clientArgs.assertHash256('hash', hash));
  }

  public iterBlocks(options?: IterOptions): AsyncIterable<Block> {
    return this.dataProvider.iterBlocks(args.assertIterOptions('options', options));
  }

  public async getBestBlockHash(): Promise<Hash256String> {
    return this.dataProvider.getBestBlockHash();
  }

  public async getBlockCount(): Promise<number> {
    return this.dataProvider.getBlockCount();
  }

  public async getContract(address: AddressString): Promise<Contract> {
    return this.dataProvider.getContract(clientArgs.assertAddress('address', address));
  }

  public async getMemPool(): Promise<readonly Hash256String[]> {
    return this.dataProvider.getMemPool();
  }

  public async getTransaction(hash: Hash256String): Promise<Transaction> {
    return this.dataProvider.getTransaction(clientArgs.assertHash256('hash', hash));
  }

  public async getConnectedPeers(): Promise<readonly Peer[]> {
    return this.dataProvider.getConnectedPeers();
  }
}
