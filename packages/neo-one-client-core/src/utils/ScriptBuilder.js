/* @flow */
import BN from 'bn.js';
import { CustomError } from '@neo-one/utils';

import _ from 'lodash';

import {
  OPCODE_TO_BYTECODE,
  type ByteCode,
  type OpCode,
  type SysCallName,
} from '../vm';
import BinaryWriter from './BinaryWriter';

import common, { type ECPoint, type UInt160, type UInt256 } from '../common';
import utils from './utils';

export class UnknownOpError extends CustomError {
  byteCode: string;
  code: string;

  constructor(byteCode: string) {
    super(`Unknown op: ${byteCode}`);
    this.byteCode = byteCode;
    this.code = 'UNKNOWN_OP';
  }
}

export class InvalidParamError extends CustomError {
  code: string;

  constructor() {
    super('Invalid Param');
    this.code = 'INVALID_PARAM';
  }
}

const BYTECODE_TO_BYTECODE_BUFFER = _.fromPairs(
  Object.values(OPCODE_TO_BYTECODE).map(byteCode => [
    byteCode,
    Buffer.from([(byteCode: $FlowFixMe)]),
  ]),
);

export type Param =
  | BN
  | number
  | UInt160
  | UInt256
  | ECPoint
  | string
  | Buffer
  | boolean
  | Array<?Param>;

export default class ScriptBuilder {
  buffers: Array<Buffer>;

  constructor() {
    this.buffers = [];
  }

  emitPush(value: Buffer): this {
    if (value.length <= OPCODE_TO_BYTECODE.PUSHBYTES75) {
      this.emitOpByte((value.length: $FlowFixMe), value);
    } else if (value.length < 0x100) {
      this.emitOp('PUSHDATA1');
      this.emitUInt8(value.length);
      this.emit(value);
    } else if (value.length < 0x10000) {
      this.emitOp('PUSHDATA2');
      this.emitUInt16LE(value.length);
      this.emit(value);
      // TODO: Check this condition if (data.Length < 0x100000000L)
    } else {
      this.emitOp('PUSHDATA4');
      this.emitUInt32LE(value.length);
      this.emit(value);
    }

    return this;
  }

  emitUInt8(value: number): this {
    const buff = Buffer.allocUnsafe(1);
    buff.writeUInt8(value, 0);
    return this.emit(buff);
  }

  emitUInt16LE(value: number): this {
    const buff = Buffer.allocUnsafe(2);
    buff.writeUInt16LE(value, 0);
    return this.emit(buff);
  }

  emitInt16LE(value: number): this {
    const buff = Buffer.allocUnsafe(2);
    buff.writeInt16LE(value, 0);
    return this.emit(buff);
  }

  emitUInt32LE(value: number): this {
    const buff = Buffer.allocUnsafe(4);
    buff.writeUInt32LE(value, 0);
    return this.emit(buff);
  }

  emitPushInt(valueIn: number | BN): this {
    const value = new BN(valueIn);
    if (value.eq(utils.NEGATIVE_ONE)) {
      return this.emitOp('PUSHM1');
    } else if (value.eq(utils.ZERO)) {
      return this.emitOp('PUSH0');
    } else if (value.gt(utils.ZERO) && value.lt(utils.SIXTEEN)) {
      return this.emitOpByte(
        (OPCODE_TO_BYTECODE.PUSH1 - 1 + value.toNumber(): $FlowFixMe),
      );
    }

    return this.emitPush(utils.toSignedBuffer(value));
  }

  emitPushUInt160(value: UInt160): this {
    return this.emitPush(common.uInt160ToBuffer(value));
  }

  emitPushUInt256(value: UInt256): this {
    return this.emitPush(common.uInt256ToBuffer(value));
  }

  emitPushECPoint(ecPoint: ECPoint): this {
    return this.emitPush(common.ecPointToBuffer(ecPoint));
  }

  emitPushString(value: string): this {
    return this.emitPush(Buffer.from(value, 'utf8'));
  }

  emitPushBoolean(value: boolean): this {
    return this.emitOp(value ? 'PUSH1' : 'PUSH0');
  }

  emitOp(op: OpCode, buffer?: ?Buffer): this {
    this.emitOpByte(OPCODE_TO_BYTECODE[op], buffer);
    return this;
  }

  emitPushParam(param: ?Param): this {
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

  emitPushParams(...params: Array<?Param>): this {
    for (let i = params.length - 1; i >= 0; i -= 1) {
      this.emitPushParam(params[i]);
    }
    return this;
  }

  emitPushArray(params: Array<?Param>): this {
    this.emitPushParams(...params);
    this.emitPushParam(params.length);
    return this.emitOp('PACK');
  }

  emitAppCallInvocation(operation: string, ...params: Array<?Param>): this {
    this.emitPushArray(params);
    return this.emitPushParam(operation);
  }

  emitAppCallVerification(scriptHash: UInt160): this {
    return this.emitOp('APPCALL', common.uInt160ToBuffer(scriptHash));
  }

  emitAppCall(
    scriptHash: UInt160,
    operation: string,
    ...params: Array<?Param>
  ): this {
    this.emitAppCallInvocation(operation, ...params);
    return this.emitAppCallVerification(scriptHash);
  }

  emitSysCall(sysCall: SysCallName, ...params: Array<?Param>): this {
    this.emitPushParams(...params);
    const sysCallBuffer = Buffer.from(sysCall, 'ascii');
    const writer = new BinaryWriter();
    writer.writeVarBytesLE(sysCallBuffer);
    return this.emitOp('SYSCALL', writer.toBuffer());
  }

  emitOpByte(byteCodeIn: ?ByteCode, buffer?: ?Buffer): this {
    const byteCode = `${byteCodeIn == null ? '' : byteCodeIn}`;
    const byteCodeBuffer = BYTECODE_TO_BYTECODE_BUFFER[byteCode];
    if (byteCodeBuffer == null) {
      throw new UnknownOpError(byteCode);
    }
    this.emit(byteCodeBuffer);
    this.emit(buffer);
    return this;
  }

  emit(buffer?: ?Buffer): this {
    if (buffer != null) {
      this.buffers.push(buffer);
    }
    return this;
  }

  build(): Buffer {
    return Buffer.concat(this.buffers);
  }
}
