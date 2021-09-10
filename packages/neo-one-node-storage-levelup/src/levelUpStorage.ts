import {
  ApplicationLog,
  BlockData,
  deserializeActionWire,
  DeserializeWireContext,
  Nep17Balance,
  Nep17BalanceKey,
  Nep17Transfer,
  Nep17TransferKey,
  Storage,
  StorageItem,
  StorageKey,
  TransactionData,
} from '@neo-one/node-core';
import { keys } from '@neo-one/node-storage-common';
import { BN } from 'bn.js';
import { LevelUp } from 'levelup';
import { convertChange } from './convertChange';
import * as read from './read';

interface LevelUpStorageOptions {
  readonly db: LevelUp;
  readonly context: DeserializeWireContext;
}

// tslint:disable-next-line: arrow-return-shorthand
export const levelUpStorage = ({ db, context }: LevelUpStorageOptions): Storage => {
  return {
    nep17Balances: read.createReadAllFindStorage({
      prefixSize: 4,
      db,
      searchRange: keys.getAllNep17BalanceSearchRange,
      getSearchRange: keys.getNep17BalanceSearchRange,
      serializeKey: keys.createNep17BalanceKey,
      deserializeValue: (buffer) =>
        Nep17Balance.deserializeWire({
          context,
          buffer,
        }),
      deserializeKey: (buffer) => Nep17BalanceKey.deserializeWire({ context, buffer }),
    }),

    nep17TransfersReceived: read.createReadFindStorage({
      prefixSize: 4,
      db,
      getSearchRange: keys.getNep17TransferReceivedSearchRange,
      serializeKey: keys.createNep17TransferReceivedKey,
      deserializeValue: (buffer) =>
        Nep17Transfer.deserializeWire({
          context,
          buffer,
        }),
      deserializeKey: (buffer) => Nep17TransferKey.deserializeWire({ context, buffer }),
    }),

    nep17TransfersSent: read.createReadFindStorage({
      prefixSize: 4,
      db,
      getSearchRange: keys.getNep17TransferSentSearchRange,
      serializeKey: keys.createNep17TransferSentKey,
      deserializeValue: (buffer) =>
        Nep17Transfer.deserializeWire({
          context,
          buffer,
        }),
      deserializeKey: (buffer) => Nep17TransferKey.deserializeWire({ context, buffer }),
    }),

    applicationLogs: read.createReadStorage({
      db,
      serializeKey: keys.createApplicationLogKey,
      deserializeValue: (buffer) => ApplicationLog.deserializeWire({ context, buffer }),
    }),

    storages: read.createReadFindStorage({
      prefixSize: 0,
      db,
      getSearchRange: keys.getStorageSearchRange,
      serializeKey: keys.createStorageKey,
      deserializeKey: (buffer) =>
        StorageKey.deserializeWire({
          context,
          buffer,
        }),
      deserializeValue: (buffer) =>
        StorageItem.deserializeWire({
          context,
          buffer,
        }),
    }),

    blockData: read.createReadStorage({
      db,
      serializeKey: keys.createBlockDataKey,
      deserializeValue: (buffer) =>
        BlockData.deserializeWire({
          context,
          buffer,
        }),
    }),

    transactionData: read.createReadStorage({
      db,
      serializeKey: keys.createTransactionDataKey,
      deserializeValue: (buffer) =>
        TransactionData.deserializeWire({
          context,
          buffer,
        }),
    }),

    action: read.createReadAllFindStorage({
      prefixSize: 4,
      db,
      searchRange: keys.getAllActionSearchRange,
      getSearchRange: keys.getActionSearchRange,
      serializeKey: keys.createActionKey,
      deserializeValue: (buffer) =>
        deserializeActionWire({
          context,
          buffer,
        }),
      deserializeKey: (key) => ({ index: new BN(key) }),
    }),

    async close(): Promise<void> {
      await db.close();
    },
    async commit(changeSet): Promise<void> {
      const changesList = changeSet.map(convertChange);
      // tslint:disable-next-line readonly-array no-any
      const changes = changesList.reduce<any[]>((acc, converted) => {
        // tslint:disable-next-line no-array-mutation
        acc.push(...converted);

        return acc;
      }, []);
      await db.batch(changes);
    },
    async commitBatch(batch): Promise<void> {
      await db.batch(batch);
    },
    async reset(): Promise<void> {
      // tslint:disable-next-line readonly-array no-any
      const batch: any[] = [];
      await new Promise<void>((resolve, reject) => {
        db.createKeyStream()
          .on('data', (key: Buffer) => {
            // tslint:disable-next-line no-array-mutation
            batch.push({ type: 'del', key });
          })
          .on('error', (error) => {
            reject(error);
          })
          .on('end', () => {
            resolve();
          });
      });
      await db.batch(batch);
    },
  };
};
