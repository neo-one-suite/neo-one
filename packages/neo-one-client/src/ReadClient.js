/* @flow */
import type {
  ABI,
  Account,
  Action,
  AddressString,
  Asset,
  Block,
  BlockFilter,
  BufferString,
  Contract,
  DataProvider,
  GetOptions,
  Hash160String,
  Hash256String,
  Peer,
  ReadSmartContract,
  StorageItem,
  Transaction,
  Validator,
} from './types'; // eslint-disable-line

import * as args from './args';
import { createReadSmartContract } from './sc';

export default class ReadClient<TDataProvider: DataProvider> {
  +dataProvider: TDataProvider;

  constructor(dataProvider: TDataProvider) {
    this.dataProvider = dataProvider;
  }

  getAccount(address: AddressString): Promise<Account> {
    args.assertAddress(address);
    return this.dataProvider.getAccount(address);
  }

  getAsset(hash: Hash256String): Promise<Asset> {
    args.assertHash256(hash);
    return this.dataProvider.getAsset(hash);
  }

  getBlock(hash: number | Hash256String, options?: GetOptions): Promise<Block> {
    if (hash == null || typeof hash !== 'number') {
      return this.dataProvider.getBlock(args.assertHash256(hash));
    }
    args.assertGetOptions(options);
    return this.dataProvider.getBlock(hash, options);
  }

  iterBlocks(filter?: BlockFilter): AsyncIterable<Block> {
    args.assertBlockFilter(filter);
    return this.dataProvider.iterBlocks(filter);
  }

  getBestBlockHash(): Promise<Hash256String> {
    return this.dataProvider.getBestBlockHash();
  }

  getBlockCount(): Promise<number> {
    return this.dataProvider.getBlockCount();
  }

  getContract(hash: Hash160String): Promise<Contract> {
    args.assertHash160(hash);
    return this.dataProvider.getContract(hash);
  }

  getMemPool(): Promise<Array<Hash256String>> {
    return this.dataProvider.getMemPool();
  }

  getTransaction(hash: Hash256String): Promise<Transaction> {
    args.assertHash256(hash);
    return this.dataProvider.getTransaction(hash);
  }

  getValidators(): Promise<Array<Validator>> {
    return this.dataProvider.getValidators();
  }

  getConnectedPeers(): Promise<Array<Peer>> {
    return this.dataProvider.getConnectedPeers();
  }

  smartContract(hash: Hash160String, abi: ABI): ReadSmartContract {
    args.assertHash160(hash);
    args.assertABI(abi);
    return createReadSmartContract({ hash, abi, client: (this: $FlowFixMe) });
  }

  _getStorage(hash: Hash160String, key: BufferString): Promise<StorageItem> {
    args.assertHash160(hash);
    args.assertBuffer(key);
    return this.dataProvider._getStorage(hash, key);
  }

  _iterStorage(hash: Hash160String): AsyncIterable<StorageItem> {
    args.assertHash160(hash);
    return this.dataProvider._iterStorage(hash);
  }

  _iterActions(filter?: BlockFilter): AsyncIterable<Action> {
    args.assertBlockFilter(filter);
    return this.dataProvider._iterActions(filter);
  }
}
