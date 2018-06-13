import BN from 'bn.js';
import _ from 'lodash';
import { common, ECPoint, UInt160, UInt256 } from '../common';
import { InvalidFormatError } from '../errors';

export class BinaryReader {
  public readonly buffer: Buffer;
  public index: number;

  constructor(buffer: Buffer, index?: number) {
    this.buffer = buffer;
    this.index = index || 0;
  }

  public get remaining(): number {
    return this.buffer.length - this.index;
  }

  public get remainingBuffer(): Buffer {
    return this.buffer.slice(this.index);
  }

  public hasMore(): boolean {
    return this.index < this.buffer.byteLength;
  }

  public clone(): BinaryReader {
    return new BinaryReader(this.buffer, this.index);
  }

  public readBytes(numBytes: number): Buffer {
    const result = this.buffer.slice(this.index, this.index + numBytes);
    this.index += numBytes;
    return result;
  }

  public readInt8(): number {
    const result = this.buffer.readInt8(this.index);
    this.index += 1;
    return result;
  }

  public readUInt8(): number {
    const result = this.buffer.readUInt8(this.index);
    this.index += 1;
    return result;
  }

  public readBoolean(): boolean {
    return this.readBytes(1)[0] !== 0;
  }

  public readInt16LE(): number {
    const result = this.buffer.readInt16LE(this.index);
    this.index += 2;
    return result;
  }

  public readUInt16LE(): number {
    const result = this.buffer.readUInt16LE(this.index);
    this.index += 2;
    return result;
  }

  public readUInt16BE(): number {
    const result = this.buffer.readUInt16BE(this.index);
    this.index += 2;
    return result;
  }

  public readInt32LE(): number {
    const result = this.buffer.readInt32LE(this.index);
    this.index += 4;
    return result;
  }

  public readUInt32LE(): number {
    const result = this.buffer.readUInt32LE(this.index);
    this.index += 4;
    return result;
  }

  public readUInt64LE(): BN {
    return new BN(this.readBytes(8), 'le');
  }

  public readInt64LE(): BN {
    const buffer = this.readBytes(8);
    return new BN(buffer, 'le').fromTwos(buffer.length * 8);
  }

  // NEO specific
  public readUInt160(): UInt160 {
    return common.bufferToUInt160(this.readBytes(common.UINT160_BUFFER_BYTES));
  }

  public readUInt256(): UInt256 {
    return common.bufferToUInt256(this.readBytes(common.UINT256_BUFFER_BYTES));
  }

  public readFixed8(): BN {
    return this.readInt64LE();
  }

  public readFixedString(length: number): string {
    const values = _.takeWhile(
      [...this.readBytes(length)],
      (value) => value !== 0,
    );

    return Buffer.from(values).toString('utf8');
  }

  public readArray<T>(read: () => T, max: number = 0x10000000): T[] {
    const count = this.readVarUIntLE(new BN(max)).toNumber();
    const result = [];
    for (let i = 0; i < count; i += 1) {
      result.push(read());
    }

    return result;
  }

  public readObject<V>(
    read: () => { key: number; value: V },
    max?: number,
  ): { [key: number]: V };
  public readObject<V>(
    read: () => { key: string; value: V },
    max?: number,
  ): { [key: string]: V };
  public readObject<V>(
    read: () => { key: string | number; value: V },
    max: number = 0x10000000,
  ): { [key: string]: V } {
    const count = this.readVarUIntLE(new BN(max)).toNumber();
    const result: { [key: string]: V } = {};
    for (let i = 0; i < count; i += 1) {
      const { key, value } = read();
      result[key] = value;
    }

    return result;
  }

  public readVarBytesLE(max: number = Number.MAX_SAFE_INTEGER): Buffer {
    return this.readBytes(this.readVarUIntLE(new BN(max)).toNumber());
  }

  public readVarUIntLE(max: BN = new BN('18446744073709551615', 10)): BN {
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
      throw new InvalidFormatError(
        `Integer too large: ${value.toString(10)} > ${max.toString(10)}`,
      );
    }

    return value;
  }

  public readVarString(max: number = 0x7fffffc7): string {
    return this.readVarBytesLE(max).toString('utf8');
  }

  public readECPoint(): ECPoint {
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
