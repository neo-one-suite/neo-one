import { SerializableWire, StorageKey, StreamOptions } from '@neo-one/node-core';

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

  public toSearchRange(): StreamOptions {
    const prefix = this.mutableBuffer;
    const lastBit = prefix[prefix.length - 1];
    const ltePrefix = Buffer.concat([prefix.slice(0, prefix.length - 1), Buffer.from([lastBit + 1])]);
    if (ltePrefix.length !== prefix.length) {
      // TODO: implement a real error, this is a failsafe because buffer manipulation
      throw new Error('Unexpected error constructing search range');
    }

    return {
      gte: StorageKey.createSearchPrefix(this.id, prefix),
      lte: StorageKey.createSearchPrefix(this.id, ltePrefix),
    };
  }

  public toStorageKey(): StorageKey {
    return new StorageKey({
      id: this.id,
      key: this.mutableBuffer,
    });
  }
}
