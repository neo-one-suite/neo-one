import { InvalidFormatError, JSONHelper, StorageChangeDeleteJSON, UInt160 } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON, SerializeJSONContext } from '../Serializable';
import { StorageChangeBase } from './StorageChangeBase';
import { StorageChangeType } from './StorageChangeType';

export interface StorageChangeDeleteAdd {
  readonly hash: UInt160;
  readonly key: Buffer;
}

export class StorageChangeDelete extends StorageChangeBase<StorageChangeType.Delete>
  implements SerializableJSON<StorageChangeDeleteJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StorageChangeDelete {
    const { type, hash, key } = super.deserializeStorageChangeWireBase(options);
    if (type !== StorageChangeType.Delete) {
      throw new InvalidFormatError(`Expected storage change type to be ${StorageChangeType.Delete}. Received: ${type}`);
    }

    return new this({ hash, key });
  }

  public constructor({ hash, key }: StorageChangeDeleteAdd) {
    super({ type: StorageChangeType.Delete, hash, key });
  }

  public serializeJSON(_context: SerializeJSONContext): StorageChangeDeleteJSON {
    return {
      type: 'Delete',
      hash: JSONHelper.writeUInt160(this.hash),
      key: JSONHelper.writeBuffer(this.key),
    };
  }
}
