import { Batch, StoragePrefix } from '@neo-one/node-core';

type ChangeType = 'Added' | 'Changed' | 'Deleted';

export interface ChangeReturn {
  readonly type: ChangeType;
  readonly key: Buffer;
  readonly value: Buffer;
}

// tslint:disable-next-line: readonly-array
export const parseChangeReturns = (changes: readonly ChangeReturn[]): Batch[] => changes.map(parseChangeReturn);

// This adds the Storage Prefix byte to all contract storage changes to keep contract/native storage
// separate from all other blockchain storage
const appendStoragePrefix = (keyIn: Buffer) => Buffer.concat([Buffer.from([StoragePrefix]), keyIn]);

const parseChangeReturn = (change: ChangeReturn): Batch => {
  switch (change.type) {
    case 'Added':
      return {
        type: 'put',
        key: appendStoragePrefix(change.key),
        value: change.value,
      };

    case 'Changed':
      return {
        type: 'put',
        key: appendStoragePrefix(change.key),
        value: change.value,
      };

    case 'Deleted':
      return {
        type: 'del',
        key: appendStoragePrefix(change.key),
      };

    default:
      throw new Error('Invalid Change Type found');
  }
};
