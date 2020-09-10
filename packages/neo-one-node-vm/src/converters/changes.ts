// import { PutBatch, DeleteBatch } from '@neo-one/node-core';

type ChangeType = 'Added' | 'Changed' | 'Deleted';
type ItemType = 'block' | 'transaction' | 'contract' | 'storage' | 'headerHashList';

export interface ChangeReturn {
  readonly type: ChangeType;
  readonly itemType: ItemType;
  readonly key: Buffer;
  readonly value: Buffer;
}

// TODO: stealing this from `node-storage-common` temporarily this should come from `node-core`.
enum Prefix {
  Block = 0x01,
  Transaction = 0x02,
  Contract = 0x50,
  Storage = 0x70,
  HeaderHashList = 0x80,
  CurrentBlock = 0xc0,
  CurrentHeader = 0xc1,
  ContractID = 0xc2,
}

const addPrefix = (prefix: Prefix, key: Buffer) => Buffer.concat([Buffer.from([prefix]), key]);

const addPrefixToKey = (type: ItemType, key: Buffer) => {
  switch (type) {
    case 'block':
      return addPrefix(Prefix.Block, key);
    case 'transaction':
      return addPrefix(Prefix.Transaction, key);
    case 'contract':
      return addPrefix(Prefix.Contract, key);
    case 'storage':
      return addPrefix(Prefix.Storage, key);
    case 'headerHashList':
      return addPrefix(Prefix.HeaderHashList, key);
    default:
      throw new Error(`Invalid type: ${type}`);
  }
};

/**
 * TODO: these batch definitions are straight from `abstract-leveldown`.
 * we should export them from a common place like `node-core` for use in
 * `node-storage-levelup` and here.
 */
interface PutBatch {
  readonly type: 'put';
  readonly key: Buffer;
  readonly value: Buffer;
}

interface DeleteBatch {
  readonly type: 'del';
  readonly key: Buffer;
}

type Batch = PutBatch | DeleteBatch;

export const parseChangeReturns = (changes: readonly ChangeReturn[]): readonly Batch[] =>
  changes.map(parseChangeReturn);

const parseChangeReturn = (change: ChangeReturn): Batch => {
  switch (change.type) {
    case 'Added':
      return {
        type: 'put',
        key: addPrefixToKey(change.itemType, change.key),
        value: change.value,
      };

    case 'Changed':
      return {
        type: 'put',
        key: addPrefixToKey(change.itemType, change.key),
        value: change.value,
      };

    case 'Deleted':
      return {
        type: 'del',
        key: addPrefixToKey(change.itemType, change.key),
      };

    default:
      throw new Error('Invalid Change Type found');
  }
};
