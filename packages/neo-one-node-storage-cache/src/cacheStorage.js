/* @flow */
import { type UInt256 } from '@neo-one/client-core';
import { type ChangeSet, type Storage } from '@neo-one/node-core';
import LRU from 'lru-cache';

import { keys } from '@neo-one/node-storage-common';

import convertChange from './convertChange';
import * as read from './read';

export type Environment = {|
  maxSizeBytes: number,
|};

export default ({
  environment,
  storage,
}: {|
  environment: Environment,
  storage: Storage,
|}): Storage => {
  const cache = LRU({
    max: environment.maxSizeBytes,
    // length: (value, key) => value.size + Buffer.byteLength(key, 'utf8'),
  });

  const serializeHeaderKey = ({
    hashOrIndex,
  }: {|
    hashOrIndex: number | UInt256,
  |}) =>
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

  const serializeBlockKey = ({
    hashOrIndex,
  }: {|
    hashOrIndex: number | UInt256,
  |}) =>
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
    blockSystemFee: read.createReadStorage({
      cache,
      storage: storage.blockSystemFee,
      serializeKeyString: keys.typeKeyToSerializeKeyString.blockSystemFee,
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
    transactionSpentCoins: read.createReadStorage({
      cache,
      storage: storage.transactionSpentCoins,
      serializeKeyString:
        keys.typeKeyToSerializeKeyString.transactionSpentCoins,
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
    async commit(changeSet: ChangeSet): Promise<void> {
      const changesList = changeSet.map(change => convertChange(change));
      for (const changes of changesList) {
        for (const change of changes) {
          switch (change.type) {
            case 'add':
              cache.set(change.key, change.value);
              break;
            case 'delete':
              cache.del(change.key);
              break;
            default:
              // eslint-disable-next-line
              (change.type: empty);
              throw new Error('For Flow');
          }
        }
      }
      await storage.commit(changeSet);
    },
  };
};
