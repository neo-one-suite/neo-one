/* @flow */
import { type Param as ScriptBuilderParam } from '@neo-one/client-core';

import type {
  ABI,
  Account,
  ActionRaw,
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
  RawInvocationResult,
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
    return this.dataProvider.getStorage(hash, key);
  }

  _iterStorage(hash: Hash160String): AsyncIterable<StorageItem> {
    args.assertHash160(hash);
    return this.dataProvider.iterStorage(hash);
  }

  _iterActionsRaw(filter?: BlockFilter): AsyncIterable<ActionRaw> {
    args.assertBlockFilter(filter);
    return this.dataProvider.iterActionsRaw(filter);
  }

  _call(
    contract: Hash160String,
    method: string,
    params: Array<?ScriptBuilderParam>,
  ): Promise<RawInvocationResult> {
    return this.dataProvider.call(contract, method, params);
  }
}
