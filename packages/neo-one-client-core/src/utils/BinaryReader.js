/* @flow */
import BN from 'bn.js';

import _ from 'lodash';

import common, { type ECPoint, type UInt160, type UInt256 } from '../common';
import { InvalidFormatError } from '../errors';

export default class BinaryReader {
  buffer: Buffer;
  index: number;

  constructor(buffer: Buffer, index?: number) {
    this.buffer = buffer;
    this.index = index || 0;
  }

  get remaining(): number {
    return this.buffer.length - this.index;
  }

  get remainingBuffer(): Buffer {
    return this.buffer.slice(this.index);
  }

  hasMore(): boolean {
    return this.index < this.buffer.byteLength;
  }

  clone(): BinaryReader {
    return new BinaryReader(this.buffer, this.index);
  }

  readBytes(numBytes: number): Buffer {
    const result = this.buffer.slice(this.index, this.index + numBytes);
    this.index += numBytes;
    return result;
  }

  readInt8(): number {
    const result = this.buffer.readInt8(this.index);
    this.index += 1;
    return result;
  }

  readUInt8(): number {
    const result = this.buffer.readUInt8(this.index);
    this.index += 1;
    return result;
  }

  readBoolean(): boolean {
    return this.readBytes(1)[0] !== 0;
  }

  readInt16LE(): number {
    const result = this.buffer.readInt16LE(this.index);
    this.index += 2;
    return result;
  }

  readUInt16LE(): number {
    const result = this.buffer.readUInt16LE(this.index);
    this.index += 2;
    return result;
  }

  readUInt16BE(): number {
    const result = this.buffer.readUInt16BE(this.index);
    this.index += 2;
    return result;
  }

  readInt32LE(): number {
    const result = this.buffer.readInt32LE(this.index);
    this.index += 4;
    return result;
  }

  readUInt32LE(): number {
    const result = this.buffer.readUInt32LE(this.index);
    this.index += 4;
    return result;
  }

  readUInt64LE(): BN {
    return new BN(this.readBytes(8), 'le');
  }

  readInt64LE(): BN {
    const buffer = this.readBytes(8);
    return new BN(buffer, 'le').fromTwos(buffer.length * 8);
  }

  // NEO specific
  readUInt160(): UInt160 {
    return common.bufferToUInt160(this.readBytes(common.UINT160_BUFFER_BYTES));
  }

  readUInt256(): UInt256 {
    return common.bufferToUInt256(this.readBytes(common.UINT256_BUFFER_BYTES));
  }

  readFixed8(): BN {
    return this.readInt64LE();
  }

  readFixedString(length: number): string {
    const values = _.takeWhile(
      [...this.readBytes(length)],
      value => value !== 0,
    );
    return Buffer.from(values).toString('utf8');
  }

  readArray<T>(read: () => T, max: number = 0x10000000): Array<T> {
    const count = this.readVarUIntLE(new BN(max)).toNumber();
    const result = [];
    for (let i = 0; i < count; i += 1) {
      result.push(read());
    }

    return result;
  }

  readObject<K, V>(
    read: () => { key: K, value: V },
    max: number = 0x10000000,
  ): { [key: K]: V } {
    const count = this.readVarUIntLE(new BN(max)).toNumber();
    const result = {};
    for (let i = 0; i < count; i += 1) {
      const { key, value } = read();
      result[(key: $FlowFixMe)] = value;
    }

    return result;
  }

  readVarBytesLE(max: number = Number.MAX_SAFE_INTEGER): Buffer {
    return this.readBytes(this.readVarUIntLE(new BN(max)).toNumber());
  }

  readVarUIntLE(max: BN = new BN('18446744073709551615', 10)): BN {
    const fb = this.readUInt8();
    let value = new BN(fb);
    if (fb === 0xfd) {
      value = new BN(this.readUInt16LE());
    } else if (fb === 0xfe) {
      value = new BN(this.readUInt32LE());
    } else if (fb === 0xff) {
      value = this.readUInt64LE();
    }

    if (value.gt(max)) {
      throw new InvalidFormatError();
    }

    return value;
  }

  readVarString(max: number = 0x7fffffc7): string {
    return this.readVarBytesLE(max).toString('utf8');
  }

  readECPoint(): ECPoint {
    const firstByte = this.readBytes(1);
    if (firstByte[0] === common.ECPOINT_INFINITY_BYTE) {
      return common.ECPOINT_INFINITY;
    }

    return common.bufferToECPoint(
      Buffer.concat([
        firstByte,
        this.readBytes(common.ECPOINT_BUFFER_BYTES - 1),
      ]),
    );
  }
}
