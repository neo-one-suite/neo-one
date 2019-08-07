import { InvalidFormatError, JSONHelper, StorageChangeModifyJSON, UInt160 } from '@neo-one/client-common';
import { DeserializeWireBaseOptions, SerializableJSON, SerializeJSONContext } from '../Serializable';
import { StorageChangeAddModifyBase } from './StorageChangeAddModifyBase';
import { StorageChangeType } from './StorageChangeType';

export interface StorageChangeModifyAdd {
  readonly hash: UInt160;
  readonly key: Buffer;
  readonly value: Buffer;
}

export class StorageChangeModify extends StorageChangeAddModifyBase<StorageChangeType.Modify>
  implements SerializableJSON<StorageChangeModifyJSON> {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StorageChangeModify {
    const { type, hash, key, value } = super.deserializeStorageChangeAddModifyWireBase(options);
    if (type !== StorageChangeType.Modify) {
      throw new InvalidFormatError(`Expected storage change type to be ${StorageChangeType.Modify}. Received: ${type}`);
    }

    return new this({ hash, key, value });
  }

  public constructor(options: StorageChangeModifyAdd) {
    super({ type: StorageChangeType.Modify, ...options });
  }

  public serializeJSON(_context: SerializeJSONContext): StorageChangeModifyJSON {
    return {
      type: 'Modify',
      hash: JSONHelper.writeUInt160(this.hash),
      key: JSONHelper.writeBuffer(this.key),
      value: JSONHelper.writeBuffer(this.value),
    };
  }
}
