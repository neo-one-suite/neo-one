import { UInt256 } from '@neo-one/client-common';
import { Change, HeaderHashList, Storage } from '@neo-one/node-core';
import LRUCache from 'lru-cache';
import { utils } from './utils';

export interface HeaderIndexCacheOptions {
  readonly storage: Storage;
  readonly initCurrentHeaderHashes: readonly UInt256[];
  readonly initStorageCount: number;
}

export class HeaderIndexCache {
  private readonly storage: Storage;
  private readonly headerHashListCache = new LRUCache<number, readonly UInt256[]>({ max: 10 });
  private readonly indexToHashCache = new LRUCache<number, UInt256>({ max: 10000 });
  private mutableCurrentHeaderHashes: readonly UInt256[];
  private mutableStorageCount: number;

  public constructor({ storage, initCurrentHeaderHashes, initStorageCount }: HeaderIndexCacheOptions) {
    this.storage = storage;
    this.mutableCurrentHeaderHashes = initCurrentHeaderHashes;
    this.mutableStorageCount = initStorageCount;
  }

  public get length() {
    return this.mutableStorageCount + this.mutableCurrentHeaderHashes.length;
  }

  public async push(hash: UInt256) {
    this.mutableCurrentHeaderHashes = this.mutableCurrentHeaderHashes.concat(hash);
    await this.trySaveHeaderHashList();
  }

  public async get(index: number) {
    const result = await this.tryGet(index);
    if (result === undefined) {
      throw new Error(`Failed to find headerHash with index ${index} in Cache or Storage.`);
    }

    return result;
  }

  public async tryGet(index: number) {
    const maybeIndexHash = this.indexToHashCache.get(index);
    if (maybeIndexHash === undefined) {
      return this.getHeaderHashIndex(index);
    }

    return maybeIndexHash;
  }

  public async dispose() {
    return this.trySaveHeaderHashList();
  }

  private async getHeaderHashIndex(index: number): Promise<UInt256 | undefined> {
    const hashListHashIndex = index % 2000;
    if (index - this.mutableStorageCount > 0) {
      return this.getHeaderHashIndexFromCurrent(hashListHashIndex);
    }

    const hashListIndex = (index - hashListHashIndex) / 2000;
    const headerHashList = await this.getHeaderHashList(hashListIndex);
    if (headerHashList === undefined) {
      return undefined;
    }
    const headerHash = headerHashList[hashListHashIndex];
    // tslint:disable-next-line: strict-type-predicates
    if (headerHash !== undefined) {
      this.indexToHashCache.set(index, headerHash);
    }

    return headerHash;
  }

  private getHeaderHashIndexFromCurrent(index: number): UInt256 | undefined {
    const headerHash = this.mutableCurrentHeaderHashes[index];
    // tslint:disable-next-line: strict-type-predicates
    if (headerHash !== undefined) {
      this.indexToHashCache.set(index, headerHash);
    }

    return headerHash;
  }

  private async getHeaderHashList(index: number): Promise<readonly UInt256[] | undefined> {
    const maybeHashList = this.headerHashListCache.get(index);
    if (maybeHashList === undefined) {
      const hashList = await this.storage.headerHashList.tryGet(index);
      const hashes = hashList?.hashes;
      if (hashes !== undefined) {
        this.headerHashListCache.set(index, hashes);
      }

      return hashes;
    }

    return maybeHashList;
  }

  private async trySaveHeaderHashList(): Promise<void> {
    if (this.mutableCurrentHeaderHashes.length >= utils.hashListBatchSize) {
      const slicedHashes = this.mutableCurrentHeaderHashes.slice(0, utils.hashListBatchSize);
      const headerHashList = new HeaderHashList({
        hashes: slicedHashes,
      });

      const change: Change = {
        type: 'add',
        change: {
          type: 'headerHashList',
          key: this.mutableStorageCount,
          value: headerHashList,
        },
        subType: 'add',
      };

      await this.storage.commit([change]);
      this.mutableCurrentHeaderHashes = this.mutableCurrentHeaderHashes.slice(utils.hashListBatchSize);
      this.mutableStorageCount = this.mutableStorageCount + utils.hashListBatchSize;
    }
  }
}
