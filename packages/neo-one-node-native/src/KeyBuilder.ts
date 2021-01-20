import { SerializableWire, StorageKey } from '@neo-one/node-core';
import { BN } from 'bn.js';

export class KeyBuilder {
  private readonly id: number;
  private mutableBuffer: Buffer;

  public constructor(id: number, prefix: Buffer) {
    if (prefix.length !== 1) {
      throw new Error('invalid prefix');
    }

    this.id = id;
    this.mutableBuffer = prefix;
  }

  public addBuffer(key: Buffer): this {
    this.mutableBuffer = Buffer.concat([this.mutableBuffer, key]);

    return this;
  }

  public addSerializable(key: SerializableWire): this {
    const serialized = key.serializeWire();
    this.mutableBuffer = Buffer.concat([this.mutableBuffer, serialized]);

    return this;
  }

  public addUInt32BE(value: number): this {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value);

    return this.addBuffer(buffer);
  }

  public addUInt64LE(value: BN): this {
    const buffer = value.toArrayLike(Buffer, 'le', 8);

    return this.addBuffer(buffer);
  }

  public toSearchPrefix(): Buffer {
    return StorageKey.createSearchPrefix(this.id, this.mutableBuffer);
  }

  public toStorageKey(): StorageKey {
    return new StorageKey({
      id: this.id,
      key: this.mutableBuffer,
    });
  }
}
