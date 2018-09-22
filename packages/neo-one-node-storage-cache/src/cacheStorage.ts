import { UInt256 } from '@neo-one/client-common';
import { Storage } from '@neo-one/node-core';
import { keys } from '@neo-one/node-storage-common';
import { utils } from '@neo-one/utils';
import LRU from 'lru-cache';
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
  const cache = LRU<string, any>({
    max: environment.maxSizeBytes,
    // length: (value, key) => value.size + Buffer.byteLength(key, 'utf8'),
  });

  const serializeHeaderKey = ({ hashOrIndex }: { hashOrIndex: number | UInt256 }) =>
    typeof hashOrIndex === 'number'
      ? `header:${hashOrIndex}`
      : keys.typeKeyToSerializeKeyString.header({ hash: hashOrIndex });

  const headerBase = read.createReadStorage({
    cache,
    storage: storage.header,
    serializeKeyString: serializeHeaderKey,
  });

  const header = {
    get: headerBase.get,
    tryGet: headerBase.tryGet,
    tryGetLatest: storage.header.tryGetLatest,
  };

  const serializeBlockKey = ({ hashOrIndex }: { hashOrIndex: number | UInt256 }) =>
    typeof hashOrIndex === 'number'
      ? `block:${hashOrIndex}`
      : keys.typeKeyToSerializeKeyString.block({ hash: hashOrIndex });

  const blockBase = read.createReadStorage({
    cache,
    storage: storage.block,
    serializeKeyString: serializeBlockKey,
  });

  const block = {
    get: blockBase.get,
    tryGet: blockBase.tryGet,
    tryGetLatest: storage.block.tryGetLatest,
  };

  return {
    header,
    block,
    blockData: read.createReadStorage({
      cache,
      storage: storage.blockData,
      serializeKeyString: keys.typeKeyToSerializeKeyString.blockData,
    }),

    account: read.createReadAllStorage({
      cache,
      storage: storage.account,
      serializeKeyString: keys.typeKeyToSerializeKeyString.account,
    }),

    accountUnspent: storage.accountUnspent,
    accountUnclaimed: storage.accountUnclaimed,
    action: storage.action,
    asset: read.createReadStorage({
      cache,
      storage: storage.asset,
      serializeKeyString: keys.typeKeyToSerializeKeyString.asset,
    }),

    transaction: read.createReadStorage({
      cache,
      storage: storage.transaction,
      serializeKeyString: keys.typeKeyToSerializeKeyString.transaction,
    }),

    transactionData: read.createReadStorage({
      cache,
      storage: storage.transactionData,
      serializeKeyString: keys.typeKeyToSerializeKeyString.transactionData,
    }),

    output: read.createReadStorage({
      cache,
      storage: storage.output,
      serializeKeyString: keys.typeKeyToSerializeKeyString.output,
    }),

    contract: read.createReadStorage({
      cache,
      storage: storage.contract,
      serializeKeyString: keys.typeKeyToSerializeKeyString.contract,
    }),

    storageItem: read.createReadGetAllStorage({
      cache,
      storage: storage.storageItem,
      serializeKeyString: keys.typeKeyToSerializeKeyString.storageItem,
    }),

    validator: read.createReadAllStorage({
      cache,
      storage: storage.validator,
      serializeKeyString: keys.typeKeyToSerializeKeyString.validator,
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
