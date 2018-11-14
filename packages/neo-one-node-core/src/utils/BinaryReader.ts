import { common, ECPoint, InvalidFormatError, UInt160, UInt256 } from '@neo-one/client-common';
import BN from 'bn.js';
import _ from 'lodash';

export class BinaryReader {
  public readonly buffer: Buffer;
  private mutableIndex: number;

  public constructor(buffer: Buffer, index = 0) {
    this.buffer = buffer;
    this.mutableIndex = index;
  }

  public get index(): number {
    return this.mutableIndex;
  }

  public get remaining(): number {
    return this.buffer.length - this.mutableIndex;
  }

  public get remainingBuffer(): Buffer {
    return this.buffer.slice(this.mutableIndex);
  }

  public hasMore(): boolean {
    return this.mutableIndex < this.buffer.byteLength;
  }

  public clone(): BinaryReader {
    return new BinaryReader(this.buffer, this.mutableIndex);
  }

  public readBytes(numBytes: number): Buffer {
    const result = this.buffer.slice(this.mutableIndex, this.mutableIndex + numBytes);
    this.mutableIndex += numBytes;

    return result;
  }

  public readInt8(): number {
    const result = this.buffer.readInt8(this.mutableIndex);
    this.mutableIndex += 1;

    return result;
  }

  public readUInt8(): number {
    const result = this.buffer.readUInt8(this.mutableIndex);
    this.mutableIndex += 1;

    return result;
  }

  public readBoolean(): boolean {
    return this.readBytes(1)[0] !== 0;
  }

  public readInt16LE(): number {
    const result = this.buffer.readInt16LE(this.mutableIndex);
    this.mutableIndex += 2;

    return result;
  }

  public readUInt16LE(): number {
    const result = this.buffer.readUInt16LE(this.mutableIndex);
    this.mutableIndex += 2;

    return result;
  }

  public readUInt16BE(): number {
    const result = this.buffer.readUInt16BE(this.mutableIndex);
    this.mutableIndex += 2;

    return result;
  }

  public readInt32LE(): number {
    const result = this.buffer.readInt32LE(this.mutableIndex);
    this.mutableIndex += 4;

    return result;
  }

  public readUInt32LE(): number {
    const result = this.buffer.readUInt32LE(this.mutableIndex);
    this.mutableIndex += 4;

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
    const values = _.takeWhile([...this.readBytes(length)], (value) => value !== 0);

    return Buffer.from(values).toString('utf8');
  }

  public readArray<T>(read: () => T, max = 0x1000000): ReadonlyArray<T> {
    const count = this.readVarUIntLE(new BN(max)).toNumber();

    return _.range(count).map(read);
  }

  public readObject<V>(
    read: () => { readonly key: number; readonly value: V },
    max?: number,
  ): { readonly [key: number]: V };
  public readObject<V>(
    read: () => { readonly key: string; readonly value: V },
    max?: number,
  ): { readonly [key: string]: V };
  public readObject<V>(
    read: () => { readonly key: string | number; readonly value: V },
    max = 0x1000000,
  ): { readonly [key: string]: V } {
    const count = this.readVarUIntLE(new BN(max)).toNumber();

    return _.range(count).reduce<{ readonly [key: string]: V }>((acc) => {
      const { key, value } = read();

      return { ...acc, [key]: value };
    }, {});
  }

  public readVarBytesLE(max = 0x1000000): Buffer {
    return this.readBytes(this.readVarUIntLE(new BN(max)).toNumber());
  }

  public readVarUIntLE(max: BN = new BN('18446744073709551615', 10)): BN {
    const fb = this.readUInt8();
    let value: BN;
    switch (fb) {
      case 0xfd:
        value = new BN(this.readUInt16LE());
        break;
      case 0xfe:
        value = new BN(this.readUInt32LE());
        break;
      case 0xff:
        value = this.readUInt64LE();
        break;
      default:
        value = new BN(fb);
    }

    if (value.gt(max)) {
      throw new InvalidFormatError(`Integer too large: ${value.toString(10)} > ${max.toString(10)}`);
    }

    return value;
  }

  public readVarString(max = 0x1000000): string {
    return this.readVarBytesLE(max).toString('utf8');
  }

  public readECPoint(): ECPoint {
    const firstByte = this.readBytes(1);
    if (firstByte[0] === common.ECPOINT_INFINITY_BYTE) {
      return common.ECPOINT_INFINITY;
    }

    return common.bufferToECPoint(Buffer.concat([firstByte, this.readBytes(common.ECPOINT_BUFFER_BYTES - 1)]));
  }
}
