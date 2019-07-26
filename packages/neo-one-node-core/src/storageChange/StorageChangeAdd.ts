import { InvalidFormatError, JSONHelper, StorageChangeAddJSON, UInt160 } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON, SerializeJSONContext } from '../Serializable';
import { StorageChangeAddModifyBase } from './StorageChangeAddModifyBase';
import { StorageChangeType } from './StorageChangeType';

export interface StorageChangeAddAdd {
  readonly hash: UInt160;
  readonly key: Buffer;
  readonly value: Buffer;
}

export class StorageChangeAdd extends StorageChangeAddModifyBase<StorageChangeType.Add>
  implements SerializableJSON<StorageChangeAddJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StorageChangeAdd {
    const { type, hash, key, value } = super.deserializeStorageChangeAddModifyWireBase(options);
    if (type !== StorageChangeType.Add) {
      throw new InvalidFormatError(`Expected storage change type to be ${StorageChangeType.Add}. Received: ${type}`);
    }

    return new this({ hash, key, value });
  }

  public constructor(options: StorageChangeAddAdd) {
    super({ type: StorageChangeType.Add, ...options });
  }

  public serializeJSON(_context: SerializeJSONContext): StorageChangeAddJSON {
    return {
      type: 'Add',
      hash: JSONHelper.writeUInt160(this.hash),
      key: JSONHelper.writeBuffer(this.key),
      value: JSONHelper.writeBuffer(this.value),
    };
  }
}
