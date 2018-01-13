/* @flow */
import BN from 'bn.js';

import { utils as commonUtils } from '@neo-one/utils';

import { InvalidFormatError } from '../errors';

import common, {
  type ECPoint,
  type UInt160,
  type UInt160Hex,
  type UInt256,
  type UInt256Hex,
} from '../common';
import utils from './utils';

export default class BinaryWriter {
  buffer: Array<Buffer>;

  constructor() {
    this.buffer = [];
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.buffer);
  }

  writeBytes(value: Buffer): this {
    this.buffer.push(value);
    return this;
  }

  writeUInt8(value: number): this {
    const buffer = Buffer.allocUnsafe(1);
    buffer.writeUInt8(value, 0);
    return this.writeBytes(buffer);
  }

  writeInt16LE(value: number): this {
    const buffer = Buffer.allocUnsafe(2);
    buffer.writeInt16LE(value, 0);
    return this.writeBytes(buffer);
  }

  writeUInt16LE(value: number): this {
    const buffer = Buffer.allocUnsafe(2);
    buffer.writeUInt16LE(value, 0);
    return this.writeBytes(buffer);
  }

  writeUInt16BE(value: number): this {
    const buffer = Buffer.allocUnsafe(2);
    buffer.writeUInt16BE(value, 0);
    return this.writeBytes(buffer);
  }

  writeInt32LE(value: number): this {
    const buffer = Buffer.allocUnsafe(4);
    buffer.writeInt32LE(value, 0);
    return this.writeBytes(buffer);
  }

  writeUInt32LE(value: number): this {
    const buffer = Buffer.allocUnsafe(4);
    buffer.writeUInt32LE(value, 0);
    return this.writeBytes(buffer);
  }

  writeInt64LE(value: BN): this {
    return this.writeBytes(value.toTwos(8 * 8).toArrayLike(Buffer, 'le', 8));
  }

  writeUInt64LE(value: BN): this {
    return this.writeBytes(value.toArrayLike(Buffer, 'le', 8));
  }

  writeBoolean(value: boolean): this {
    this.writeBytes(Buffer.from([value ? 1 : 0]));
    return this;
  }

  // Special methods that don't fit the LE mold and/or are specific to NEO.
  writeUInt160(hash: UInt160 | UInt160Hex): this {
    return this.writeBytes(common.uInt160ToBuffer(hash));
  }

  writeUInt256(hash: UInt256 | UInt256Hex): this {
    return this.writeBytes(common.uInt256ToBuffer(hash));
  }

  writeFixed8(value: BN): this {
    return this.writeInt64LE(value);
  }

  writeFixedString(value: string, length: number): this {
    if (value.length > length) {
      throw new InvalidFormatError();
    }

    const buffer = Buffer.from(value, 'utf8');
    if (buffer.length > length) {
      throw new InvalidFormatError();
    }

    this.writeBytes(buffer);
    if (buffer.length < length) {
      this.writeBytes(Buffer.alloc(length - buffer.length, 0));
    }

    return this;
  }

  writeArray<T>(values: Array<T>, write: (value: T) => void): this {
    this.writeVarUIntLE(values.length);
    values.forEach(value => write(value));
    return this;
  }

  writeObject<K, V>(
    value: { [key: K]: V },
    write: (key: K, value: V) => void,
  ): this {
    const entries = commonUtils.entries(value);
    this.writeVarUIntLE(entries.length);
    for (const [key, val] of entries) {
      write(key, val);
    }
    return this;
  }

  writeVarBytesLE(value: Buffer): this {
    this.writeVarUIntLE(value.length);
    return this.writeBytes(value);
  }

  writeVarUIntLE(valueIn: number | BN): this {
    const value = new BN(valueIn);
    if (value.lt(utils.ZERO)) {
      throw new InvalidFormatError();
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

  writeVarString(value: string, max?: number): this {
    let buffer = Buffer.from(value, 'utf8');
    if (max != null) {
      buffer = buffer.slice(0, max);
    }
    return this.writeVarBytesLE(buffer);
  }

  writeECPoint(value: ECPoint): this {
    if (common.ecPointIsInfinity(value)) {
      return this.writeBytes(Buffer.from([common.ECPOINT_INFINITY_BYTE]));
    }

    return this.writeBytes(common.ecPointToBuffer(value));
  }
}
