import { common, UInt256 } from '@neo-one/client-common';
import {
  Block,
  BlockchainSettings,
  HashIndexState,
  LedgerContract as LedgerContractNode,
  NativeContractStorageContext,
  TransactionState,
  TrimmedBlock,
  utils,
} from '@neo-one/node-core';
import { utils as oneUtils } from '@neo-one/utils';
import { toArray } from 'rxjs/operators';
import { ledgerMethods } from './methods';
import { NativeContract } from './NativeContract';

export class LedgerContract extends NativeContract implements LedgerContractNode {
  private readonly prefixes = {
    blockHash: Buffer.from([9]),
    currentBlock: Buffer.from([12]),
    block: Buffer.from([5]),
    transaction: Buffer.from([11]),
  };
  private readonly settings: BlockchainSettings;

  public constructor(settings: BlockchainSettings) {
    super({
      name: 'LedgerContract',
      id: -4,
      methods: ledgerMethods,
      settings,
    });

    this.settings = settings;
  }

  public async isInitialized({ storages }: NativeContractStorageContext) {
    const items = await storages
      .find$(this.createStorageKey(this.prefixes.block).toSearchPrefix())
      .pipe(toArray())
      .toPromise();

    return items.length !== 0;
  }

  public async getBlockHash({ storages }: NativeContractStorageContext, index: number) {
    const item = await storages.tryGet(
      this.createStorageKey(this.prefixes.blockHash).addUInt32BE(index).toStorageKey(),
    );

    return item === undefined ? undefined : common.bufferToUInt256(item.value);
  }

  public async currentHash({ storages }: NativeContractStorageContext) {
    const item = await storages.get(this.createStorageKey(this.prefixes.currentBlock).toStorageKey());

    return utils.getInteroperable(item, HashIndexState.fromStackItem).hash;
  }

  public async currentIndex({ storages }: NativeContractStorageContext) {
    const item = await storages.get(this.createStorageKey(this.prefixes.currentBlock).toStorageKey());

    return utils.getInteroperable(item, HashIndexState.fromStackItem).index;
  }

  public async containsBlock({ storages }: NativeContractStorageContext, hash: UInt256) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.block).addBuffer(hash).toStorageKey());

    return item === undefined;
  }

  public async containsTransaction({ storages }: NativeContractStorageContext, hash: UInt256) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.transaction).addBuffer(hash).toStorageKey());

    return item !== undefined;
  }

  public async getTrimmedBlock({ storages }: NativeContractStorageContext, hash: UInt256) {
    const item = await storages.tryGet(this.createStorageKey(this.prefixes.block).addBuffer(hash).toStorageKey());

    return item === undefined
      ? undefined
      : TrimmedBlock.deserializeWire({
          buffer: item.value,
          context: { validatorsCount: this.settings.validatorsCount, network: this.settings.network },
        });
  }

  public async getBlock(context: NativeContractStorageContext, hashOrIndex: UInt256 | number) {
    let hash = hashOrIndex;

    if (typeof hash === 'number') {
      const maybeBlockHash = await this.getBlockHash(context, hash);

      if (maybeBlockHash === undefined) {
        return undefined;
      }

      hash = maybeBlockHash;
    }

    const state = await this.getTrimmedBlock(context, hash);

    if (state === undefined) {
      return undefined;
    }

    const transactionsOut = await Promise.all(
      state.hashes.slice(1).map(async (tx) => this.getTransaction(context, tx)),
    );
    const transactions = await Promise.all(
      transactionsOut.filter(oneUtils.notNull).map(async (tx) => this.getTransaction(context, tx.hash)),
    );

    return new Block({
      header: state.header,
      transactions: transactions.filter(oneUtils.notNull),
    });
  }

  public async getHeader(context: NativeContractStorageContext, hashOrIndex: UInt256 | number) {
    let hash = hashOrIndex;

    if (typeof hash === 'number') {
      const maybeHeaderHash = await this.getBlockHash(context, hash);

      if (maybeHeaderHash === undefined) {
        return undefined;
      }

      hash = maybeHeaderHash;
    }

    const trimmed = await this.getTrimmedBlock(context, hash);

    return trimmed?.header;
  }

  public async getTransactionState({ storages }: NativeContractStorageContext, hash: UInt256) {
    const state = await storages.tryGet(
      this.createStorageKey(this.prefixes.transaction).addBuffer(hash).toStorageKey(),
    );

    return state === undefined ? undefined : utils.getInteroperable(state, TransactionState.fromStackItem);
  }

  public async getTransaction(context: NativeContractStorageContext, hash: UInt256) {
    const state = await this.getTransactionState(context, hash);

    return state?.transaction;
  }
}
