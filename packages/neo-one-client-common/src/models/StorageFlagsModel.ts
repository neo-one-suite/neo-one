import { InvalidStorageFlagsError, InvalidStorageFlagsJSONError } from '../errors';
import { StorageFlagsJSON } from './types';

export enum StorageFlagsModel {
  None = 0,
  Constant = 0x01,
}

export const hasStorageFlag = (
  assetType: StorageFlagsModel,
  flag: StorageFlagsModel,
  // tslint:disable-next-line
): boolean => (assetType & flag) === flag;

const isStorageFlags = (storageFlags: number): storageFlags is StorageFlagsModel =>
  // tslint:disable-next-line strict-type-predicates
  StorageFlagsModel[storageFlags] !== undefined;

export const assertStorageFlags = (storageFlags: number): StorageFlagsModel => {
  if (!isStorageFlags(storageFlags)) {
    throw new InvalidStorageFlagsError(storageFlags);
  }

  return storageFlags;
};

export const toJSONStorageFlags = (type: StorageFlagsModel): StorageFlagsJSON =>
  assertStorageFlagsJSON(StorageFlagsModel[type]);

const isStorageFlagsJSON = (storageFlags: string): storageFlags is StorageFlagsJSON =>
  // tslint:disable-next-line strict-type-predicates no-any
  StorageFlagsModel[storageFlags as any] !== undefined;

export const assertStorageFlagsJSON = (type: string): StorageFlagsJSON => {
  if (!isStorageFlagsJSON(type)) {
    throw new InvalidStorageFlagsJSONError(type);
  }

  return type;
};

export const toStorageFlags = (type: StorageFlagsJSON): StorageFlagsModel => StorageFlagsModel[type];
