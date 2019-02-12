import { InvalidStorageChangeTypeError } from '../errors';

export enum StorageChangeType {
  Add = 0x00,
  Modify = 0x01,
  Delete = 0x02,
}

const isStorageChangeType = (storageChangeType: number): storageChangeType is StorageChangeType =>
  // tslint:disable-next-line strict-type-predicates
  StorageChangeType[storageChangeType] !== undefined;

export const assertStorageChangeType = (storageChangeType: number): StorageChangeType => {
  if (isStorageChangeType(storageChangeType)) {
    return storageChangeType;
  }
  throw new InvalidStorageChangeTypeError(storageChangeType);
};
