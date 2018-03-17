/* @flow */
import type { Monitor } from '@neo-one/monitor';
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
} from './types';

import * as args from './args';
import { createReadSmartContract } from './sc';

export default class ReadClient<TDataProvider: DataProvider> {
  +dataProvider: TDataProvider;

  constructor(dataProvider: TDataProvider) {
    this.dataProvider = dataProvider;
  }

  getAccount(address: AddressString, monitor?: Monitor): Promise<Account> {
    args.assertAddress(address);
    return this.dataProvider.getAccount(address, monitor);
  }

  getAsset(hash: Hash256String, monitor?: Monitor): Promise<Asset> {
    args.assertHash256(hash);
    return this.dataProvider.getAsset(hash, monitor);
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

  getBestBlockHash(monitor?: Monitor): Promise<Hash256String> {
    return this.dataProvider.getBestBlockHash(monitor);
  }

  getBlockCount(monitor?: Monitor): Promise<number> {
    return this.dataProvider.getBlockCount(monitor);
  }

  getContract(hash: Hash160String, monitor?: Monitor): Promise<Contract> {
    args.assertHash160(hash);
    return this.dataProvider.getContract(hash, monitor);
  }

  getMemPool(monitor?: Monitor): Promise<Array<Hash256String>> {
    return this.dataProvider.getMemPool(monitor);
  }

  getTransaction(hash: Hash256String, monitor?: Monitor): Promise<Transaction> {
    args.assertHash256(hash);
    return this.dataProvider.getTransaction(hash, monitor);
  }

  getValidators(monitor?: Monitor): Promise<Array<Validator>> {
    return this.dataProvider.getValidators(monitor);
  }

  getConnectedPeers(monitor?: Monitor): Promise<Array<Peer>> {
    return this.dataProvider.getConnectedPeers(monitor);
  }

  smartContract(hash: Hash160String, abi: ABI): ReadSmartContract {
    args.assertHash160(hash);
    args.assertABI(abi);
    return createReadSmartContract({ hash, abi, client: (this: $FlowFixMe) });
  }

  _getStorage(
    hash: Hash160String,
    key: BufferString,
    monitor?: Monitor,
  ): Promise<StorageItem> {
    args.assertHash160(hash);
    args.assertBuffer(key);
    return this.dataProvider.getStorage(hash, key, monitor);
  }

  _iterStorage(
    hash: Hash160String,
    monitor?: Monitor,
  ): AsyncIterable<StorageItem> {
    args.assertHash160(hash);
    return this.dataProvider.iterStorage(hash, monitor);
  }

  _iterActionsRaw(filter?: BlockFilter): AsyncIterable<ActionRaw> {
    args.assertBlockFilter(filter);
    return this.dataProvider.iterActionsRaw(filter);
  }

  _call(
    contract: Hash160String,
    method: string,
    params: Array<?ScriptBuilderParam>,
    monitor?: Monitor,
  ): Promise<RawInvocationResult> {
    return this.dataProvider.call(contract, method, params, monitor);
  }
}
