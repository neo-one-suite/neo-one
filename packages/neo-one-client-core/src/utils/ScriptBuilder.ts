import { CustomError } from '@neo-one/utils';
import BN from 'bn.js';
import { common, ECPoint, UInt160, UInt256 } from '../common';
import { ByteBuffer, ByteCode, Op, OpCode, SysCallName } from '../vm';
import { BinaryWriter } from './BinaryWriter';
import { utils } from './utils';

export class UnknownOpError extends CustomError {
  public readonly byteCode: string;
  public readonly code: string;

  constructor(byteCode: string) {
    super(`Unknown op: ${byteCode}`);
    this.byteCode = byteCode;
    this.code = 'UNKNOWN_OP';
  }
}

export class InvalidParamError extends CustomError {
  public readonly code: string;

  constructor() {
    super('Invalid Param');
    this.code = 'INVALID_PARAM';
  }
}

export interface ParamArray extends Array<Param | null> {}
export type Param =
  | BN
  | number
  | UInt160
  | UInt256
  | ECPoint
  | string
  | Buffer
  | boolean
  | ParamArray;

export class ScriptBuilder {
  public readonly buffers: Buffer[];

  constructor() {
    this.buffers = [];
  }

  public emitPush(value: Buffer): this {
    if (value.length <= Op.PUSHBYTES75) {
      this.emitOpByte(value.length as any, value);
    } else if (value.length < 0x100) {
      this.emitOp('PUSHDATA1');
      this.emitUInt8(value.length);
      this.emit(value);
    } else if (value.length < 0x10000) {
      this.emitOp('PUSHDATA2');
      this.emitUInt16LE(value.length);
      this.emit(value);
    } else if (value.length < 0x100000000) {
      this.emitOp('PUSHDATA4');
      this.emitUInt32LE(value.length);
      this.emit(value);
    } else {
      throw new Error('Invalid buffer length');
    }

    return this;
  }

  public emitUInt8(value: number): this {
    const buff = Buffer.allocUnsafe(1);
    buff.writeUInt8(value, 0);
    return this.emit(buff);
  }

  public emitUInt16LE(value: number): this {
    const buff = Buffer.allocUnsafe(2);
    buff.writeUInt16LE(value, 0);
    return this.emit(buff);
  }

  public emitInt16LE(value: number): this {
    const buff = Buffer.allocUnsafe(2);
    buff.writeInt16LE(value, 0);
    return this.emit(buff);
  }

  public emitUInt32LE(value: number): this {
    const buff = Buffer.allocUnsafe(4);
    buff.writeUInt32LE(value, 0);
    return this.emit(buff);
  }

  public emitPushInt(valueIn: number | BN): this {
    const value = new BN(valueIn);
    if (value.eq(utils.NEGATIVE_ONE)) {
      return this.emitOp('PUSHM1');
    } else if (value.eq(utils.ZERO)) {
      return this.emitOp('PUSH0');
    } else if (value.gt(utils.ZERO) && value.lt(utils.SIXTEEN)) {
      return this.emitOpByte(Op.PUSH1 - 1 + value.toNumber());
    }

    return this.emitPush(utils.toSignedBuffer(value));
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

  public emitPushString(value: string): this {
    return this.emitPush(Buffer.from(value, 'utf8'));
  }

  public emitPushBoolean(value: boolean): this {
    return this.emitOp(value ? 'PUSH1' : 'PUSH0');
  }

  public emitOp(op: OpCode, buffer?: Buffer | null): this {
    this.emitOpByte(Op[op], buffer);
    return this;
  }

  public emitPushParam(param: Param | null): this {
    if (param == null) {
      return this.emitPush(Buffer.alloc(0, 0));
    } else if (Array.isArray(param)) {
      return this.emitPushArray(param);
    } else if (common.isUInt160(param)) {
      return this.emitPushUInt160(common.asUInt160(param));
    } else if (common.isUInt256(param)) {
      return this.emitPushUInt256(common.asUInt256(param));
    } else if (common.isECPoint(param)) {
      return this.emitPushECPoint(common.asECPoint(param));
    } else if (typeof param === 'number' || param instanceof BN) {
      return this.emitPushInt(param);
    } else if (typeof param === 'string') {
      return this.emitPushString(param);
    } else if (typeof param === 'boolean') {
      return this.emitPushBoolean(param);
    } else if (param instanceof Buffer) {
      return this.emitPush(param);
    }

    throw new InvalidParamError();
  }

  public emitPushParams(...params: Array<Param | null>): this {
    for (let i = params.length - 1; i >= 0; i -= 1) {
      this.emitPushParam(params[i]);
    }
    return this;
  }

  public emitPushArray(params: Array<Param | null>): this {
    this.emitPushParams(...params);
    this.emitPushParam(params.length);
    return this.emitOp('PACK');
  }

  public emitAppCallInvocation(
    operation: string,
    ...params: Array<Param | null>
  ): this {
    this.emitPushArray(params);
    return this.emitPushParam(operation);
  }

  public emitAppCallVerification(scriptHash: UInt160): this {
    return this.emitOp('APPCALL', common.uInt160ToBuffer(scriptHash));
  }

  public emitAppCall(
    scriptHash: UInt160,
    operation: string,
    ...params: Array<Param | null>
  ): this {
    this.emitAppCallInvocation(operation, ...params);
    return this.emitAppCallVerification(scriptHash);
  }

  public emitTailCall(
    scriptHash: UInt160,
    operation: string,
    ...params: Array<Param | null>
  ): this {
    this.emitAppCallInvocation(operation, ...params);
    return this.emitOp('TAILCALL', common.uInt160ToBuffer(scriptHash));
  }

  public emitSysCall(
    sysCall: SysCallName,
    ...params: Array<Param | null>
  ): this {
    this.emitPushParams(...params);
    const sysCallBuffer = Buffer.from(sysCall, 'ascii');
    const writer = new BinaryWriter();
    writer.writeVarBytesLE(sysCallBuffer);
    return this.emitOp('SYSCALL', writer.toBuffer());
  }

  public emitOpByte(byteCode: ByteCode, buffer?: Buffer | null): this {
    const byteCodeBuffer = ByteBuffer[byteCode];
    this.emit(byteCodeBuffer);
    this.emit(buffer);
    return this;
  }

  public emit(buffer?: Buffer | null): this {
    if (buffer != null) {
      this.buffers.push(buffer);
    }
    return this;
  }

  public build(): Buffer {
    return Buffer.concat(this.buffers);
  }
}
