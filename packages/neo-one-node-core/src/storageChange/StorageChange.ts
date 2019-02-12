import { createDeserializeWire, DeserializeWireBaseOptions } from '../Serializable';
import { StorageChangeAdd } from './StorageChangeAdd';
import { StorageChangeDelete } from './StorageChangeDelete';
import { StorageChangeModify } from './StorageChangeModify';
import { assertStorageChangeType, StorageChangeType } from './StorageChangeType';

export type StorageChange = StorageChangeAdd | StorageChangeModify | StorageChangeDelete;

export const deserializeStorageChangeWireBase = (options: DeserializeWireBaseOptions): StorageChange => {
  const { reader } = options;
  const storageChangeType = assertStorageChangeType(reader.clone().readUInt8());
  switch (storageChangeType) {
    case StorageChangeType.Modify:
      return StorageChangeModify.deserializeWireBase(options);
    case StorageChangeType.Add:
      return StorageChangeAdd.deserializeWireBase(options);
    case StorageChangeType.Delete:
      return StorageChangeDelete.deserializeWireBase(options);
    default:
      throw new Error('Invalid Storage Change Type');
  }
};

export const deserializeStorageChangeWire = createDeserializeWire(deserializeStorageChangeWireBase);
