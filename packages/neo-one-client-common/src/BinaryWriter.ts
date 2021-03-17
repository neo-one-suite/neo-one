import { BN } from 'bn.js';
import { common, ECPoint, ECPointHex, InvalidFormatError, UInt160, UInt160Hex, UInt256, UInt256Hex } from './common';
import { utils } from './utils';

interface OpOptions<T> {
  readonly fn: (value: T, buffer: Buffer, pos: number) => void;
  readonly length: number;
  readonly value: T;
}

// tslint:disable-next-line: no-any
class Op<OpValue = any> {
  public readonly fn: (value: OpValue, buffer: Buffer, pos: number) => void;
  public readonly length: number;
  public readonly value: OpValue;
  private mutableNext?: Op;

  public constructor(options: OpOptions<OpValue>) {
    this.fn = options.fn;
    this.length = options.length;
    this.value = options.value;
  }

  public get next() {
    return this.mutableNext;
  }

  // tslint:disable-next-line: no-any
  public setNext<NextValue = any>(nextOp: Op<NextValue>) {
    if (this.mutableNext !== undefined) {
      throw new Error('next operation already set for this op.');
    }
    this.mutableNext = nextOp;
  }
}

const writeByte = (value: number, buffer: Buffer, position: number) => {
  // tslint:disable-next-line: no-object-mutation no-bitwise
  buffer[position] = value & 255;
};

const writeFromBuffer = (source: Buffer, target: Buffer, offset = 0) => {
  source.forEach((bit, index) => {
    // tslint:disable-next-line: no-object-mutation no-bitwise
    target[index + offset] = bit & 255;
  });
};

const writeUInt160 = (value: UInt160 | UInt160Hex, buffer: Buffer, position: number) => {
  const result = common.uInt160ToBuffer(value);
  if (result.length !== common.UINT160_BUFFER_BYTES) {
    throw new Error('Invalid UInt160');
  }
  writeFromBuffer(result, buffer, position);
};

const writeUInt256 = (value: UInt256 | UInt256Hex, buffer: Buffer, position: number) => {
  const result = common.uInt256ToBuffer(value);
  if (result.length !== common.UINT256_BUFFER_BYTES) {
    throw new Error('Invalid UInt256');
  }
  writeFromBuffer(result, buffer, position);
};

const writeECPoint = (value: ECPoint | ECPointHex, buffer: Buffer, position: number) => {
  const result = common.ecPointToBuffer(value);
  if (result.length !== common.ECPOINT_BUFFER_BYTES) {
    throw new Error('Invalid ECPoint');
  }

  writeFromBuffer(result, buffer, position);
};

export class BinaryWriter {
  private readonly head: Op;
  private mutableLength: number;
  private mutableTail: Omit<Op, 'next'>;

  public constructor() {
    this.head = new Op({
      fn: () => {
        // do nothing
      },
      length: 0,
      value: undefined,
    });
    this.mutableTail = this.head;
    this.mutableLength = 0;
  }

  private get length() {
    return this.mutableLength;
  }

  public toBuffer() {
    return this.finish();
  }

  public writeBytes(value: Buffer): this {
    return this.push({
      fn: writeFromBuffer,
      length: value.length,
      value,
    });
  }

  public writeUInt8(value: number): this {
    return this.push({
      fn: (val: number, buffer: Buffer, pos: number) => buffer.writeUInt8(val, pos),
      length: 1,
      value,
    });
  }

  public writeInt16LE(value: number): this {
    return this.push({
      fn: (val: number, buffer: Buffer, pos: number) => buffer.writeInt16LE(val, pos),
      length: 2,
      value,
    });
  }

  public writeUInt16LE(value: number): this {
    return this.push({
      fn: (val: number, buffer: Buffer, pos: number) => buffer.writeUInt16LE(val, pos),
      length: 2,
      value,
    });
  }

  public writeUInt16BE(value: number): this {
    return this.push({
      fn: (val: number, buffer: Buffer, pos: number) => buffer.writeUInt16BE(val, pos),
      length: 2,
      value,
    });
  }

  public writeInt32LE(value: number): this {
    return this.push({
      fn: (val: number, buffer: Buffer, pos: number) => buffer.writeInt32LE(val, pos),
      length: 4,
      value,
    });
  }

  public writeUInt32LE(value: number): this {
    return this.push({
      fn: (val: number, buffer: Buffer, pos: number) => buffer.writeUInt32LE(val, pos),
      length: 4,
      value,
    });
  }

  public writeInt64LE(value: BN): this {
    return this.push({
      fn: (val: BN, buffer: Buffer, pos: number) => {
        const source = val.toTwos(8 * 8).toArrayLike(Buffer, 'le', 8);
        writeFromBuffer(source, buffer, pos);
      },
      length: 8,
      value,
    });
  }

  public writeUInt64LE(value: BN): this {
    return this.push({
      fn: (val: BN, buffer: Buffer, pos: number) => {
        const source = val.toArrayLike(Buffer, 'le', 8);
        writeFromBuffer(source, buffer, pos);
      },
      length: 8,
      value,
    });
  }

  public writeBoolean(value: boolean): this {
    return this.push({
      fn: writeByte,
      length: 1,
      value: value ? 1 : 0,
    });
  }

  public writeUInt160(hash: UInt160 | UInt160Hex): this {
    return this.push({
      fn: writeUInt160,
      length: common.UINT160_BUFFER_BYTES,
      value: hash,
    });
  }

  public writeUInt256(hash: UInt256 | UInt256Hex): this {
    return this.push({
      fn: writeUInt256,
      length: common.UINT256_BUFFER_BYTES,
      value: hash,
    });
  }

  public writeFixed8(value: BN): this {
    return this.writeInt64LE(value);
  }

  public writeFixedString(value: string, length: number): this {
    if (value.length > length) {
      throw new InvalidFormatError('String too long');
    }
    const stringBuffer = Buffer.from(value, 'utf8');
    if (stringBuffer.length > length) {
      throw new InvalidFormatError('String buffer length too long');
    }

    return this.push({
      fn: (val: Buffer, buffer: Buffer, pos: number) => {
        writeFromBuffer(val, buffer, pos);
        const padLength = val.length - length;
        if (padLength > 0) {
          writeFromBuffer(Buffer.alloc(padLength, 0), buffer, pos + val.length);
        }
      },
      length,
      value: stringBuffer,
    });
  }

  public writeArray<T>(values: readonly T[], write: (value: T) => void): this {
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

    return this.push({
      fn: (val: Buffer, buffer: Buffer, pos: number) => {
        writeFromBuffer(val, buffer, pos);
      },
      length: value.length,
      value,
    });
  }

  public writeVarBytesLEWithoutVar(value: Buffer): this {
    return this.push({
      fn: (val: Buffer, buffer: Buffer, pos: number) => {
        writeFromBuffer(val, buffer, pos);
      },
      length: value.length,
      value,
    });
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

  public writeVarStringWithoutVar(value: string, max?: number): this {
    let buffer = Buffer.from(value, 'utf8');
    if (max !== undefined) {
      buffer = buffer.slice(0, max);
    }

    return this.writeVarBytesLEWithoutVar(buffer);
  }

  public writeECPoint(value: ECPoint): this {
    if (common.ecPointIsInfinity(value)) {
      return this.push({
        fn: writeByte,
        length: 1,
        value: common.ECPOINT_INFINITY_BYTE,
      });
    }

    return this.push({
      fn: writeECPoint,
      length: common.ECPOINT_BUFFER_BYTES,
      value,
    });
  }

  private finish() {
    const computedBuffer = Buffer.alloc(this.length);
    let head = this.head.next;
    let position = 0;
    // tslint:disable-next-line: no-loop-statement
    while (head !== undefined) {
      head.fn(head.value, computedBuffer, position);
      position += head.length;
      head = head.next;
    }

    return computedBuffer;
  }

  private push<T>(op: Omit<OpOptions<T>, 'next'>): this {
    const newOp = new Op(op);
    this.mutableTail.setNext(newOp);
    this.mutableTail = newOp;
    this.mutableLength += op.length;

    return this;
  }
}
