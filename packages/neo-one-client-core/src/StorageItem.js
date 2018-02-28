/* @flow */
import { type Equatable, type Equals } from './Equatable';
import {
  type DeserializeWireBaseOptions,
  type DeserializeWireOptions,
  type SerializeJSONContext,
  type SerializableJSON,
  type SerializeWire,
  type SerializableWire,
  createSerializeWire,
} from './Serializable';

import common, { type UInt160 } from './common';
import utils, {
  BinaryReader,
  type BinaryWriter,
  IOHelper,
  JSONHelper,
} from './utils';

export type StorageItemAdd = {|
  hash: UInt160,
  key: Buffer,
  value: Buffer,
|};
export type StorageItemUpdate = {|
  value: Buffer,
|};
export type StorageItemsKey = {|
  hash?: UInt160,
  prefix?: Buffer,
|};
export type StorageItemKey = {|
  hash: UInt160,
  key: Buffer,
|};

export type StorageItemJSON = {|
  hash: string,
  key: string,
  value: string,
|};

export default class StorageItem
  implements
    SerializableWire<StorageItem>,
    Equatable,
    SerializableJSON<StorageItemJSON> {
  hash: UInt160;
  key: Buffer;
  value: Buffer;

  __size: () => number;

  constructor({ hash, key, value }: StorageItemAdd) {
    this.hash = hash;
    this.key = key;
    this.value = value;
    this.__size = utils.lazy(
      () =>
        IOHelper.sizeOfUInt160 +
        IOHelper.sizeOfVarBytesLE(this.key) +
        IOHelper.sizeOfVarBytesLE(this.value),
    );
  }

  get size(): number {
    return this.__size();
  }

  equals: Equals = utils.equals(
    StorageItem,
    other =>
      common.uInt160Equal(this.hash, other.hash) &&
      this.key.equals(other.key) &&
      this.value.equals(other.value),
  );

  update({ value }: StorageItemUpdate): StorageItem {
    return new this.constructor({
      hash: this.hash,
      key: this.key,
      value,
    });
  }

  serializeWireBase(writer: BinaryWriter): void {
    writer.writeUInt160(this.hash);
    writer.writeVarBytesLE(this.key);
    writer.writeVarBytesLE(this.value);
  }

  serializeWire: SerializeWire = createSerializeWire(
    this.serializeWireBase.bind(this),
  );

  static deserializeWireBase({
    reader,
  }: DeserializeWireBaseOptions): StorageItem {
    const hash = reader.readUInt160();
    const key = reader.readVarBytesLE();
    const value = reader.readVarBytesLE();

    return new this({
      hash,
      key,
      value,
    });
  }

  static deserializeWire(options: DeserializeWireOptions): this {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  // eslint-disable-next-line
  serializeJSON(context: SerializeJSONContext): StorageItemJSON {
    return {
      hash: JSONHelper.writeUInt160(this.hash),
      key: JSONHelper.writeBuffer(this.key),
      value: JSONHelper.writeBuffer(this.value),
    };
  }
}
