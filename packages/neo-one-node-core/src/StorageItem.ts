import {
  BinaryReader,
  BinaryWriter,
  createSerializeWire,
  InvalidFormatError,
  JSONHelper,
} from '@neo-one/client-common';
import { BN } from 'bn.js';
import { DeserializeWireBaseOptions, DeserializeWireOptions, SerializableWire } from './Serializable';
import { StorageKey } from './StorageKey';

// TODO: Cache can also be 2 other things, we should definitely revisit this when we have more context
export interface StorageItemCacheAdd {
  readonly cache: BN;
}

export interface StorageItemValueAdd {
  readonly value: Buffer;
}

// tslint:disable-next-line: no-any
const isStorageItemCacheAdd = (value: any): value is StorageItemCacheAdd =>
  value?.cache !== undefined && BN.isBN(value.cache);

type StorageItemAdd = StorageItemCacheAdd | StorageItemValueAdd;

export class StorageItem implements SerializableWire {
  public static deserializeWireBase(options: DeserializeWireBaseOptions): StorageItem {
    const { reader } = options;
    const value = reader.readBytes(reader.buffer.length);

    return new this({
      value,
    });
  }

  public static deserializeWire(options: DeserializeWireOptions): StorageItem {
    return this.deserializeWireBase({
      context: options.context,
      reader: new BinaryReader(options.buffer),
    });
  }

  public readonly serializeWire = createSerializeWire(this.serializeWireBase.bind(this));

  private mutableValue: Buffer | undefined;
  private mutableCache: BN | undefined;

  public constructor(options: StorageItemAdd) {
    this.mutableValue = isStorageItemCacheAdd(options) ? undefined : options.value;
    this.mutableCache = isStorageItemCacheAdd(options) ? options.cache : undefined;
  }

  public get value(): Buffer {
    if (this.mutableValue !== undefined) {
      return this.mutableValue;
    }

    if (this.mutableCache === undefined) {
      throw new InvalidFormatError();
    }

    this.mutableValue = this.mutableCache.toBuffer();
    this.mutableCache = undefined;

    return this.mutableValue;
  }

  public set value(value: Buffer) {
    this.mutableValue = value;
    this.mutableCache = undefined;
  }

  public set(integer: BN) {
    this.mutableCache = integer;
    this.mutableValue = undefined;
  }

  public add(integer: BN) {
    if (BN.isBN(this.mutableCache)) {
      this.set(this.mutableCache.add(integer));
    } else if (this.mutableValue !== undefined) {
      this.set(new BN(this.mutableValue).add(integer));
    } else {
      throw new InvalidFormatError();
    }
  }

  public serializeWireBase(writer: BinaryWriter) {
    writer.writeBytes(this.value);
  }

  public clone() {
    return new StorageItem({
      value: this.value,
    });
  }

  public serializeJSON(key: StorageKey) {
    return {
      key: JSONHelper.writeBase64Buffer(key.serializeWire()),
      value: JSONHelper.writeBase64Buffer(this.value),
    };
  }
}
