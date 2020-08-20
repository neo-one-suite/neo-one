import { UInt256 } from '@neo-one/client-common';
import {
  Account,
  AccountUnclaimed,
  AccountUnspent,
  Asset,
  Block,
  BlockData,
  BlockKey,
  Contract,
  deserializeActionWire,
  DeserializeWireContext,
  Header,
  HeaderKey,
  InvocationData,
  Output,
  Storage,
  StorageItem,
  TransactionData,
  Validator,
  ValidatorsCount,
} from '@neo-one/node-core';
import { keys } from '@neo-one/node-storage-common';
import { LevelUp } from 'levelup';
import * as common from './common';
import { convertChange } from './convertChange';
import { KeyNotFoundError } from './errors';
import * as read from './read';

interface LevelUpStorageOptions {
  readonly db: LevelUp;
  readonly context: DeserializeWireContext;
}

export const levelUpStorage = ({ db, context }: LevelUpStorageOptions): Storage => {
  const getHash = async ({ hashOrIndex }: HeaderKey): Promise<UInt256> => {
    let hash = hashOrIndex;
    if (typeof hash === 'number') {
      try {
        const result = await db.get(keys.serializeHeaderIndexHashKey(hash));
        hash = common.deserializeHeaderHash(result as Buffer);
      } catch (error) {
        if (error.notFound) {
          throw new KeyNotFoundError(`${hash}`);
        }
        throw error;
      }
    }

    return hash;
  };

  const headerBase = read.createReadStorage({
    db,
    serializeKey: keys.typeKeyToSerializeKey.header,
    deserializeValue: (buffer) =>
      Header.deserializeWire({
        context,
        buffer,
      }),
  });

  const getHeader = async ({ hashOrIndex }: HeaderKey): Promise<Header> => {
    const hash = await getHash({ hashOrIndex });

    return headerBase.get({ hash });
  };

  const header = {
    get: getHeader,
    tryGet: read.createTryGet({ get: getHeader }),
    tryGetLatest: read.createTryGetLatest({
      db,
      latestKey: keys.maxHeaderHashKey,
      deserializeResult: (result) => ({
        hash: common.deserializeHeaderHash(result),
      }),

      get: headerBase.get,
    }),
  };

  const blockBase = read.createReadStorage({
    db,
    serializeKey: keys.typeKeyToSerializeKey.block,
    deserializeValue: (buffer) =>
      Block.deserializeWire({
        context,
        buffer,
      }),
  });

  const getBlock = async ({ hashOrIndex }: BlockKey): Promise<Block> => {
    const hash = await getHash({ hashOrIndex });

    return blockBase.get({ hash });
  };

  const block = {
    get: getBlock,
    tryGet: read.createTryGet({ get: getBlock }),
    tryGetLatest: read.createTryGetLatest({
      db,
      latestKey: keys.maxBlockHashKey,
      deserializeResult: (result) => ({
        hash: common.deserializeBlockHash(result),
      }),

      get: blockBase.get,
    }),
  };

  const transaction = read.createReadStorage({
    db,
    serializeKey: keys.typeKeyToSerializeKey.transaction,
    deserializeValue: (buffer) =>
      deserializeTransactionWire({
        context,
        buffer,
      }),
  });

  const output = read.createReadStorage({
    db,
    serializeKey: keys.typeKeyToSerializeKey.output,
    deserializeValue: (buffer) => Output.deserializeWire({ context, buffer }),
  });

  return {
    header,
    block,
    blockData: read.createReadStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.blockData,
      deserializeValue: (buffer) =>
        BlockData.deserializeWire({
          context,
          buffer,
        }),
    }),

    account: read.createReadAllStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.account,
      minKey: keys.accountMinKey,
      maxKey: keys.accountMaxKey,
      deserializeValue: (buffer) =>
        Account.deserializeWire({
          context,
          buffer,
        }),
    }),

    accountUnclaimed: read.createReadGetAllStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.accountUnclaimed,
      getMinKey: keys.getAccountUnclaimedKeyMin,
      getMaxKey: keys.getAccountUnclaimedKeyMax,
      deserializeValue: (buffer) =>
        AccountUnclaimed.deserializeWire({
          context,
          buffer,
        }),
    }),

    accountUnspent: read.createReadGetAllStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.accountUnspent,
      getMinKey: keys.getAccountUnspentKeyMin,
      getMaxKey: keys.getAccountUnspentKeyMax,
      deserializeValue: (buffer) =>
        AccountUnspent.deserializeWire({
          context,
          buffer,
        }),
    }),

    action: read.createReadGetAllStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.action,
      getMinKey: keys.getActionKeyMin,
      getMaxKey: keys.getActionKeyMax,
      deserializeValue: (buffer) =>
        deserializeActionWire({
          context,
          buffer,
        }),
    }),

    asset: read.createReadStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.asset,
      deserializeValue: (buffer) =>
        Asset.deserializeWire({
          context,
          buffer,
        }),
    }),

    transaction,
    transactionData: read.createReadStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.transactionData,
      deserializeValue: (buffer) => TransactionData.deserializeWire({ context, buffer }),
    }),

    output,
    contract: read.createReadStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.contract,
      deserializeValue: (buffer) =>
        Contract.deserializeWire({
          context,
          buffer,
        }),
    }),

    storageItem: read.createReadGetAllStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.storageItem,
      getMinKey: keys.getStorageItemKeyMin,
      getMaxKey: keys.getStorageItemKeyMax,
      deserializeValue: (buffer) =>
        StorageItem.deserializeWire({
          context,
          buffer,
        }),
    }),

    validator: read.createReadAllStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.validator,
      minKey: keys.validatorMinKey,
      maxKey: keys.validatorMaxKey,
      deserializeValue: (buffer) =>
        Validator.deserializeWire({
          context,
          buffer,
        }),
    }),

    invocationData: read.createReadStorage({
      db,
      serializeKey: keys.typeKeyToSerializeKey.invocationData,
      deserializeValue: (buffer) =>
        InvocationData.deserializeWire({
          context,
          buffer,
        }),
    }),

    validatorsCount: read.createReadMetadataStorage({
      db,
      key: keys.validatorsCountKey,
      deserializeValue: (buffer) =>
        ValidatorsCount.deserializeWire({
          context,
          buffer,
        }),
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
