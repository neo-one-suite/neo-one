import { BN } from 'bn.js';
import { common, ECPoint, UInt160, UInt256 } from './common';
import { InvalidJumpError } from './errors';
import { ByteBuffer, ByteCode, Op, OpCode } from './models/vm';
import { utils } from './utils';

const sbyteMaxValue = 127;
const sbyteMinValue = -128;

const isEvenOp = (op: OpCode) => Op[op] % 2 === 0;
const isOutOfBoundsOffset = (offset: number) => offset < sbyteMinValue || offset > sbyteMaxValue;

/* BaseScriptBuilder should stay as close to the C# `neo-vm` implementation as possible */
export class BaseScriptBuilder {
  public get buffers(): readonly Buffer[] {
    return this.mutableBuffers;
  }
  private readonly mutableBuffers: Buffer[];

  public constructor() {
    this.mutableBuffers = [];
  }

  public emitOp(op: OpCode, buffer?: Buffer | undefined): this {
    this.emitOpByte(Op[op], buffer);

    return this;
  }

  public emitOpByte(byteCode: ByteCode, buffer?: Buffer | undefined): this {
    const byteCodeBuffer = ByteBuffer[byteCode];
    this.emitRaw(byteCodeBuffer);
    this.emitRaw(buffer);

    return this;
  }

  public emitCall(offset: number): this {
    if (isOutOfBoundsOffset(offset)) {
      return this.emitOp('CALL_L', utils.toSignedBuffer(new BN(offset)));
    }

    return this.emitOp('CALL', Buffer.from([offset]));
  }

  public emitJump(op: OpCode, offset: number) {
    if (Op[op] < Op.JMP || Op[op] > Op.JMPLE_L) {
      throw new InvalidJumpError(op);
    }
    if (isEvenOp(op)) {
      if (isOutOfBoundsOffset(offset)) {
        return this.emitOpByte(Op[op] + 1, utils.toSignedBuffer(new BN(offset)));
      }

      return this.emitOp(op, Buffer.from([offset]));
    }

    return this.emitOp(op, utils.toSignedBuffer(new BN(offset)));
  }

  public emitPush(value: Buffer): this {
    if (value.length < 0x100) {
      this.emitOp('PUSHDATA1');
      this.emitUInt8(value.length);
      this.emitRaw(value);
    } else if (value.length < 0x10000) {
      this.emitOp('PUSHDATA2');
      this.emitUInt16LE(value.length);
      this.emitRaw(value);
    } else if (value.length < 0x100000000) {
      this.emitOp('PUSHDATA4');
      this.emitUInt32LE(value.length);
      this.emitRaw(value);
    } else {
      /* istanbul ignore next */
      throw new Error('Invalid buffer length');
    }

    return this;
  }

  public emitPushInt(valueIn: number | BN): this {
    const value = new BN(valueIn);
    if (value.gte(utils.NEGATIVE_ONE) && value.lte(utils.SIXTEEN)) {
      return this.emitOpByte(Op.PUSH0 + value.toNumber());
    }
    const data = utils.toSignedBuffer(value);
    if (data.length === 1) {
      return this.emitOp('PUSHINT8', data);
    }
    if (data.length === 2) {
      return this.emitOp('PUSHINT16', data);
    }
    if (data.length <= 4) {
      return this.emitOp('PUSHINT32', this.padRight(value, 4));
    }
    if (data.length <= 8) {
      return this.emitOp('PUSHINT64', this.padRight(value, 8));
    }
    if (data.length <= 16) {
      return this.emitOp('PUSHINT128', this.padRight(value, 16));
    }
    if (data.length <= 32) {
      return this.emitOp('PUSHINT256', this.padRight(value, 32));
    }
    throw new Error('Invalid buffer length');
  }

  public padRight(value: BN, length: number): Buffer {
    const isNeg = value.isNeg();
    if (!isNeg) {
      return value.toArrayLike(Buffer, 'le', length);
    }

    const byteLength = value.byteLength();
    const fillBytes = length - byteLength;

    return Buffer.concat([
      value.toTwos(byteLength * 8).toArrayLike(Buffer, 'le'),
      Buffer.alloc(fillBytes, Buffer.from([255])),
    ]);
  }

  public emitPushBoolean(value: boolean): this {
    return this.emitOp(value ? 'PUSH1' : 'PUSH0');
  }

  public emitPushString(value: string): this {
    return this.emitPush(Buffer.from(value, 'utf8'));
  }

  public emitRaw(buffer?: Buffer | undefined): this {
    if (buffer !== undefined) {
      this.mutableBuffers.push(buffer);
    }

    return this;
  }

  public emitUInt8(value: number): this {
    const buff = Buffer.allocUnsafe(1);
    buff.writeUInt8(value, 0);

    return this.emitRaw(buff);
  }

  public emitUInt16LE(value: number): this {
    const buff = Buffer.allocUnsafe(2);
    buff.writeUInt16LE(value, 0);

    return this.emitRaw(buff);
  }

  public emitInt16LE(value: number): this {
    const buff = Buffer.allocUnsafe(2);
    buff.writeInt16LE(value, 0);

    return this.emitRaw(buff);
  }

  public emitUInt32LE(value: number): this {
    const buff = Buffer.allocUnsafe(4);
    buff.writeUInt32LE(value, 0);

    return this.emitRaw(buff);
  }

  public emitPushUInt160(value: UInt160): this {
    return this.emitPush(common.uInt160ToBuffer(value));
  }
  public emitPushUInt256(value: UInt256): this {
    return this.emitPush(common.uInt256ToBuffer(value));
  }
  public emitPushECPoint(ecPoint: ECPoint): this {
    return this.emitPush(common.ecPointToBuffer(ecPoint));
  }

  public build(): Buffer {
    return Buffer.concat(this.mutableBuffers);
  }

  protected emitSysCallInternal(hash: Buffer) {
    return this.emitOp('SYSCALL', hash);
  }
}
