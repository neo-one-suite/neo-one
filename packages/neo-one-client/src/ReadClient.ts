import { Param as ScriptBuilderParam } from '@neo-one/client-core';
import { Monitor } from '@neo-one/monitor';
import * as args from './args';
import { createReadSmartContract } from './sc';
import {
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
  Input,
  Output,
  Peer,
  RawInvocationResult,
  ReadSmartContract,
  ReadSmartContractDefinition,
  StorageItem,
  Transaction,
  Validator,
} from './types';

export class ReadClient<TDataProvider extends DataProvider = DataProvider> {
  public readonly dataProvider: TDataProvider;

  public constructor(dataProvider: TDataProvider) {
    this.dataProvider = dataProvider;
  }

  public async getAccount(address: AddressString, monitor?: Monitor): Promise<Account> {
    args.assertAddress(address);

    return this.dataProvider.getAccount(address, monitor);
  }

  public async getAsset(hash: Hash256String, monitor?: Monitor): Promise<Asset> {
    args.assertHash256(hash);

    return this.dataProvider.getAsset(hash, monitor);
  }

  public async getBlock(hash: number | Hash256String, options?: GetOptions): Promise<Block> {
    args.assertGetOptions(options);

    if (typeof hash === 'number') {
      return this.dataProvider.getBlock(hash, options);
    }

    return this.dataProvider.getBlock(args.assertHash256(hash));
  }

  public iterBlocks(filter?: BlockFilter): AsyncIterable<Block> {
    args.assertBlockFilter(filter);

    return this.dataProvider.iterBlocks(filter);
  }

  public async getBestBlockHash(monitor?: Monitor): Promise<Hash256String> {
    return this.dataProvider.getBestBlockHash(monitor);
  }

  public async getBlockCount(monitor?: Monitor): Promise<number> {
    return this.dataProvider.getBlockCount(monitor);
  }

  public async getContract(hash: Hash160String, monitor?: Monitor): Promise<Contract> {
    args.assertHash160(hash);

    return this.dataProvider.getContract(hash, monitor);
  }

  public async getMemPool(monitor?: Monitor): Promise<ReadonlyArray<Hash256String>> {
    return this.dataProvider.getMemPool(monitor);
  }

  public async getTransaction(hash: Hash256String, monitor?: Monitor): Promise<Transaction> {
    args.assertHash256(hash);

    return this.dataProvider.getTransaction(hash, monitor);
  }

  public async getOutput(input: Input, monitor?: Monitor): Promise<Output> {
    return this.dataProvider.getOutput(input, monitor);
  }

  public async getValidators(monitor?: Monitor): Promise<ReadonlyArray<Validator>> {
    return this.dataProvider.getValidators(monitor);
  }

  public async getConnectedPeers(monitor?: Monitor): Promise<ReadonlyArray<Peer>> {
    return this.dataProvider.getConnectedPeers(monitor);
  }

  public smartContract(definition: ReadSmartContractDefinition): ReadSmartContract {
    args.assertHash160(definition.hash);
    args.assertABI(definition.abi);

    return createReadSmartContract({ definition, client: this });
  }

  public async getStorage(hash: Hash160String, key: BufferString, monitor?: Monitor): Promise<StorageItem> {
    args.assertHash160(hash);
    args.assertBuffer(key);

    return this.dataProvider.getStorage(hash, key, monitor);
  }

  public iterStorage(hash: Hash160String, monitor?: Monitor): AsyncIterable<StorageItem> {
    args.assertHash160(hash);

    return this.dataProvider.iterStorage(hash, monitor);
  }

  public iterActionsRaw(filter?: BlockFilter): AsyncIterable<ActionRaw> {
    args.assertBlockFilter(filter);

    return this.dataProvider.iterActionsRaw(filter);
  }

  public async call(
    contract: Hash160String,
    method: string,
    params: ReadonlyArray<ScriptBuilderParam | undefined>,
    monitor?: Monitor,
  ): Promise<RawInvocationResult> {
    return this.dataProvider.call(contract, method, params, monitor);
  }
}
