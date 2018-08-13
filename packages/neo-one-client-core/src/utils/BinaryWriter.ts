import { BN } from 'bn.js';
import { common, ECPoint, UInt160, UInt160Hex, UInt256, UInt256Hex } from '../common';
import { InvalidFormatError } from '../errors';
import { utils } from './utils';

export class BinaryWriter {
  private readonly mutableBuffer: Buffer[];

  public constructor() {
    this.mutableBuffer = [];
  }

  public get buffer(): ReadonlyArray<Buffer> {
    return this.mutableBuffer;
  }

  public toBuffer(): Buffer {
    return Buffer.concat(this.mutableBuffer);
  }

  public writeBytes(value: Buffer): this {
    this.mutableBuffer.push(value);

    return this;
  }

  public writeUInt8(value: number): this {
    const buffer = Buffer.allocUnsafe(1);
    buffer.writeUInt8(value, 0);

    return this.writeBytes(buffer);
  }

  public writeInt16LE(value: number): this {
    const buffer = Buffer.allocUnsafe(2);
    buffer.writeInt16LE(value, 0);

    return this.writeBytes(buffer);
  }

  public writeUInt16LE(value: number): this {
    const buffer = Buffer.allocUnsafe(2);
    buffer.writeUInt16LE(value, 0);

    return this.writeBytes(buffer);
  }

  public writeUInt16BE(value: number): this {
    const buffer = Buffer.allocUnsafe(2);
    buffer.writeUInt16BE(value, 0);

    return this.writeBytes(buffer);
  }

  public writeInt32LE(value: number): this {
    const buffer = Buffer.allocUnsafe(4);
    buffer.writeInt32LE(value, 0);

    return this.writeBytes(buffer);
  }

  public writeUInt32LE(value: number): this {
    const buffer = Buffer.allocUnsafe(4);
    buffer.writeUInt32LE(value, 0);

    return this.writeBytes(buffer);
  }

  public writeInt64LE(value: BN): this {
    return this.writeBytes(value.toTwos(8 * 8).toArrayLike(Buffer, 'le', 8));
  }

  public writeUInt64LE(value: BN): this {
    return this.writeBytes(value.toArrayLike(Buffer, 'le', 8));
  }

  public writeBoolean(value: boolean): this {
    this.writeBytes(Buffer.from([value ? 1 : 0]));

    return this;
  }

  // Special methods that don't fit the LE mold and/or are specific to NEO.
  public writeUInt160(hash: UInt160 | UInt160Hex): this {
    return this.writeBytes(common.uInt160ToBuffer(hash));
  }

  public writeUInt256(hash: UInt256 | UInt256Hex): this {
    return this.writeBytes(common.uInt256ToBuffer(hash));
  }

  public writeFixed8(value: BN): this {
    return this.writeInt64LE(value);
  }

  public writeFixedString(value: string, length: number): this {
    if (value.length > length) {
      throw new InvalidFormatError('String too long');
    }

    const buffer = Buffer.from(value, 'utf8');
    if (buffer.length > length) {
      throw new InvalidFormatError('String buffer length too long');
    }

    this.writeBytes(buffer);
    if (buffer.length < length) {
      this.writeBytes(Buffer.alloc(length - buffer.length, 0));
    }

    return this;
  }

  public writeArray<T>(values: ReadonlyArray<T>, write: (value: T) => void): this {
    this.writeVarUIntLE(values.length);
    values.forEach(write);

    return this;
  }

  public writeObject<T, K extends keyof T>(value: T, write: (key: K, value: T[K]) => void): this {
    const entries = Object.entries(value) as Array<[K, T[K]]>;
    this.writeVarUIntLE(entries.length);
    entries.forEach(([key, val]) => {
      write(key, val);
    });

    return this;
  }

  public writeVarBytesLE(value: Buffer): this {
    this.writeVarUIntLE(value.length);

    return this.writeBytes(value);
  }

  public writeVarUIntLE(valueIn: number | BN): this {
    const value = new BN(valueIn);
    if (value.lt(utils.ZERO)) {
      throw new InvalidFormatError('Expected value to be zero or positive');
    }

    if (value.lt(utils.FD)) {
      this.writeUInt8(value.toNumber());
    } else if (value.lte(utils.FFFF)) {
      this.writeUInt8(0xfd);
      this.writeUInt16LE(value.toNumber());
    } else if (value.lte(utils.FFFFFFFF)) {
      this.writeUInt8(0xfe);
      this.writeUInt32LE(value.toNumber());
    } else {
      this.writeUInt8(0xff);
      this.writeUInt64LE(value);
    }

    return this;
  }

  public writeVarString(value: string, max?: number): this {
    let buffer = Buffer.from(value, 'utf8');
    if (max !== undefined) {
      buffer = buffer.slice(0, max);
    }

    return this.writeVarBytesLE(buffer);
  }

  public writeECPoint(value: ECPoint): this {
    if (common.ecPointIsInfinity(value)) {
      return this.writeBytes(Buffer.from([common.ECPOINT_INFINITY_BYTE]));
    }

    return this.writeBytes(common.ecPointToBuffer(value));
  }
}
