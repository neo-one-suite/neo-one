// import { UInt256 } from '@neo-one/client-common';
import {
  ApplicationLog,
  BinaryReader,
  BlockKey,
  // ContractIDState,
  DeserializeWireContext,
  // InvocationData,
  // HashIndexState,
  // TransactionData,
  Nep17Balance,
  Nep17BalanceKey,
  Nep17Transfer,
  Nep17TransferKey,
  Storage,
  StorageItem,
  StorageKey,
  // TransactionState,
  TrimmedBlock,
} from '@neo-one/node-core';
import { keys } from '@neo-one/node-storage-common';
import { LevelUp } from 'levelup';
import { convertChange } from './convertChange';
// import { KeyNotFoundError } from './errors';
import * as read from './read';

interface LevelUpStorageOptions {
  readonly db: LevelUp;
  readonly context: DeserializeWireContext;
}

export const levelUpStorage = ({ db, context }: LevelUpStorageOptions): Storage => {
  // TODO: implement getting blockHash from an index
  // const getHash = async ({ hashOrIndex }: { readonly hashOrIndex: UInt256 | number }): Promise<UInt256> => {
  //   let hash = hashOrIndex;
  //   if (typeof hash === 'number') {
  //     try {
  //       const result = await db.get(keys.serializeHeaderIndexHashKey(hash));
  //       hash = common.deserializeHeaderHash(result as Buffer);
  //     } catch (error) {
  //       if (error.notFound) {
  //         throw new KeyNotFoundError(`${hash}`);
  //       }
  //       throw error;
  //     }
  //   }

  //   return hash;
  // };

  const blockBase = read.createReadStorage({
    db,
    serializeKey: keys.createBlockKey,
    deserializeValue: (buffer) =>
      TrimmedBlock.deserializeWireBase({
        context,
        reader: new BinaryReader(buffer),
      }),
  });

  const getBlock = async ({ hashOrIndex }: BlockKey): Promise<TrimmedBlock> => {
    // const hash = await getHash({ hashOrIndex });
    // TODO: implement getting block hash from index
    if (typeof hashOrIndex === 'number') {
      throw new Error('not implemented');
    }

    return blockBase.get({ hashOrIndex });
  };

  // TODO: confirm when this is in storage blocks come back in order using this range
  const blocks = {
    get: getBlock,
    tryGet: read.createTryGet({ get: getBlock }),
    all$: read.createAll$({
      db,
      range: { gte: keys.minBlockKey, lte: keys.maxBlockKey },
      deserializeValue: (buffer) =>
        TrimmedBlock.deserializeWire({
          context,
          buffer,
        }),
    }),
  };

  return {
    // blocks,

    nep17Balances: read.createReadAllFindStorage({
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

    // transactions: read.createReadStorage({
    //   db,
    //   serializeKey: keys.createTransactionKey,
    //   deserializeValue: (buffer) =>
    //     TransactionState.deserializeWire({
    //       context,
    //       buffer,
    //     }),
    // }),

    storages: read.createReadFindStorage({
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

    // headerHashList: read.createReadStorage({
    //   db,
    //   serializeKey: keys.createHeaderHashListKey,
    //   deserializeValue: (buffer) =>
    //     HeaderHashList.deserializeWire({
    //       context,
    //       buffer,
    //     }),
    // }),

    // blockHashIndex: read.createReadMetadataStorage({
    //   db,
    //   key: keys.blockHashIndexKey,
    //   deserializeValue: (buffer) => HashIndexState.deserializeWire({ context, buffer }),
    // }),

    // headerHashIndex: read.createReadMetadataStorage({
    //   db,
    //   key: keys.headerHashIndexKey,
    //   deserializeValue: (buffer) => HashIndexState.deserializeWire({ context, buffer }),
    // }),

    // contractID: read.createReadMetadataStorage({
    //   db,
    //   key: keys.headerHashIndexKey,
    //   deserializeValue: (buffer) => ContractIDState.deserializeWire({ context, buffer }),
    // }),

    // consensusState: read.createReadMetadataStorage({
    //   db,
    //   key: keys.consensusStateKey,
    //   deserializeValue: (buffer) => ConsensusContext.deserializeWire({ context, buffer }),
    // }),

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
// blockData: read.createReadStorage({
//   db,
//   serializeKey: keys.typeKeyToSerializeKey.blockData,
//   deserializeValue: (buffer) =>
//     BlockData.deserializeWire({
//       context,
//       buffer,
//     }),
// }),
//
// action: read.createReadGetAllStorage({
//   db,
//   serializeKey: keys.typeKeyToSerializeKey.action,
//   getMinKey: keys.getActionKeyMin,
//   getMaxKey: keys.getActionKeyMax,
//   deserializeValue: (buffer) =>
//     deserializeActionWire({
//       context,
//       buffer,
//     }),
// }),
//
// transactionData: read.createReadStorage({
//   db,
//   serializeKey: keys.typeKeyToSerializeKey.transactionData,
//   deserializeValue: (buffer) => TransactionData.deserializeWire({ context, buffer }),
// }),
// validator: read.createReadAllStorage({
//     db,
//     serializeKey: keys.typeKeyToSerializeKey.validator,
//     minKey: keys.validatorMinKey,
//     maxKey: keys.validatorMaxKey,
//     deserializeValue: (buffer) =>
//       Validator.deserializeWire({
//         context,
//         buffer,
//       }),
//   }),

//   invocationData: read.createReadStorage({
//     db,
//     serializeKey: keys.typeKeyToSerializeKey.invocationData,
//     deserializeValue: (buffer) =>
//       InvocationData.deserializeWire({
//         context,
//         buffer,
//       }),
//   }),

//   validatorsCount: read.createReadMetadataStorage({
//     db,
//     key: keys.validatorsCountKey,
//     deserializeValue: (buffer) =>
//       ValidatorsCount.deserializeWire({
//         context,
//         buffer,
//       }),
//   }),
// };
