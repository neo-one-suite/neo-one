import {
  ApplicationLog,
  BinaryReader,
  BlockKey,
  ConsensusContext,
  ContractIDState,
  ContractState,
  DeserializeWireContext,
  // InvocationData,
  HashIndexState,
  HeaderHashList,
  // TransactionData,
  Nep5Balance,
  Nep5BalanceKey,
  Nep5Transfer,
  Nep5TransferKey,
  Storage,
  StorageItem,
  StorageKey,
  TransactionState,
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
  // const getHash = async ({ hashOrIndex }: HeaderKey): Promise<UInt256> => {
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
    blocks,

    nep5Balances: read.createReadAllFindStorage({
      db,
      searchRange: keys.getAllNep5BalanceSearchRange,
      getSearchRange: keys.getNep5BalanceSearchRange,
      serializeKey: keys.createNep5BalanceKey,
      deserializeValue: (buffer) =>
        Nep5Balance.deserializeWire({
          context,
          buffer,
        }),
      deserializeKey: (buffer) => Nep5BalanceKey.deserializeWire({ context, buffer }),
    }),

    nep5TransfersReceived: read.createReadFindStorage({
      db,
      getSearchRange: keys.getNep5TransferReceivedSearchRange,
      serializeKey: keys.createNep5TransferReceivedKey,
      deserializeValue: (buffer) =>
        Nep5Transfer.deserializeWire({
          context,
          buffer,
        }),
      deserializeKey: (buffer) => Nep5TransferKey.deserializeWire({ context, buffer }),
    }),

    nep5TransfersSent: read.createReadFindStorage({
      db,
      getSearchRange: keys.getNep5TransferSentSearchRange,
      serializeKey: keys.createNep5TransferSentKey,
      deserializeValue: (buffer) =>
        Nep5Transfer.deserializeWire({
          context,
          buffer,
        }),
      deserializeKey: (buffer) => Nep5TransferKey.deserializeWire({ context, buffer }),
    }),

    applicationLogs: read.createReadStorage({
      db,
      serializeKey: keys.createApplicationLogKey,
      deserializeValue: (buffer) => ApplicationLog.deserializeWire({ context, buffer }),
    }),

    transactions: read.createReadStorage({
      db,
      serializeKey: keys.createTransactionKey,
      deserializeValue: (buffer) =>
        TransactionState.deserializeWire({
          context,
          buffer,
        }),
    }),

    contracts: read.createReadStorage({
      db,
      serializeKey: keys.createContractKey,
      deserializeValue: (buffer) =>
        ContractState.deserializeWire({
          context,
          buffer,
        }),
    }),

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

    headerHashList: read.createReadStorage({
      db,
      serializeKey: keys.createHeaderHashListKey,
      deserializeValue: (buffer) =>
        HeaderHashList.deserializeWire({
          context,
          buffer,
        }),
    }),

    blockHashIndex: read.createReadMetadataStorage({
      db,
      key: keys.blockHashIndexKey,
      deserializeValue: (buffer) => HashIndexState.deserializeWire({ context, buffer }),
    }),

    headerHashIndex: read.createReadMetadataStorage({
      db,
      key: keys.headerHashIndexKey,
      deserializeValue: (buffer) => HashIndexState.deserializeWire({ context, buffer }),
    }),

    contractID: read.createReadMetadataStorage({
      db,
      key: keys.headerHashIndexKey,
      deserializeValue: (buffer) => ContractIDState.deserializeWire({ context, buffer }),
    }),

    consensusState: read.createReadMetadataStorage({
      db,
      key: keys.consensusStateKey,
      deserializeValue: (buffer) => ConsensusContext.deserializeWire({ context, buffer }),
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
