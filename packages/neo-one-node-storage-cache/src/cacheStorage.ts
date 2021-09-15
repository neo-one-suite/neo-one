import { UInt256 } from '@neo-one/client-common';
import { Storage } from '@neo-one/node-core';
import { keys } from '@neo-one/node-storage-common';
import { utils } from '@neo-one/utils';
import LRUCache from 'lru-cache';
import { convertChange } from './convertChange';
import * as read from './read';
export interface Environment {
  readonly maxSizeBytes: number;
}

export const cacheStorage = ({
  environment,
  storage,
}: {
  readonly environment: Environment;
  readonly storage: Storage;
}): Storage => {
  // tslint:disable-next-line no-any
  const cache = new LRUCache<string, any>({
    max: environment.maxSizeBytes,
    // length: (value, key) => value.size + Buffer.byteLength(key, 'utf8'),
  });

  return {
    header,
    block,
    blockData: read.createReadStorage({
      cache,
      storage: storage.blockData,
      serializeKeyString: keys.typeKeyToSerializeKey.blockData,
    }),

    account: read.createReadAllStorage({
      cache,
      storage: storage.account,
      serializeKeyString: keys.typeKeyToSerializeKey.account,
    }),

    accountUnspent: storage.accountUnspent,
    accountUnclaimed: storage.accountUnclaimed,
    action: storage.action,
    asset: read.createReadStorage({
      cache,
      storage: storage.asset,
      serializeKeyString: keys.typeKeyToSerializeKey.asset,
    }),

    transaction: read.createReadStorage({
      cache,
      storage: storage.transaction,
      serializeKeyString: keys.typeKeyToSerializeKey.transaction,
    }),

    transactionData: read.createReadStorage({
      cache,
      storage: storage.transactionData,
      serializeKeyString: keys.typeKeyToSerializeKey.transactionData,
    }),

    output: read.createReadStorage({
      cache,
      storage: storage.output,
      serializeKeyString: keys.typeKeyToSerializeKey.output,
    }),

    contract: read.createReadStorage({
      cache,
      storage: storage.contract,
      serializeKeyString: keys.typeKeyToSerializeKey.contract,
    }),

    storageItem: read.createReadGetAllStorage({
      cache,
      storage: storage.storageItem,
      serializeKeyString: keys.typeKeyToSerializeKey.storageItem,
    }),

    validator: read.createReadAllStorage({
      cache,
      storage: storage.validator,
      serializeKeyString: keys.typeKeyToSerializeKey.validator,
    }),

    invocationData: storage.invocationData,
    validatorsCount: storage.validatorsCount,
    async close(): Promise<void> {
      await storage.close();
    },
    async commit(changeSet): Promise<void> {
      const changesList = changeSet.map(convertChange);
      // tslint:disable-next-line no-loop-statement
      for (const changes of changesList) {
        // tslint:disable-next-line no-loop-statement
        for (const change of changes) {
          switch (change.type) {
            case 'add':
              cache.set(change.key, change.value);
              break;
            case 'delete':
              cache.del(change.key);
              break;
            default:
              utils.assertNever(change);
              throw new Error('For TS');
          }
        }
      }
      await storage.commit(changeSet);
    },
    async reset(): Promise<void> {
      cache.reset();
      await storage.reset();
    },
  };
};
