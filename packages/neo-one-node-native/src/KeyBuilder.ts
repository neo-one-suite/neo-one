import { SerializableWire, StorageKey } from '@neo-one/node-core';

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
