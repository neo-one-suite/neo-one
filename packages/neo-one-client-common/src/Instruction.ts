import { assertByteCode, Op, operandSizePrefixTable, operandSizeTable } from './models';

export class Instruction {
  public static readonly RET = new Instruction(Buffer.from([Op.RET]), 0);
  public readonly opCode: Op;
  public readonly operand: Buffer;

  public constructor(script: Buffer, ipIn: number) {
    this.opCode = assertByteCode(script[ipIn]);
    let ip = ipIn + 1;

    const operandSizePrefix = operandSizePrefixTable[this.opCode];
    let operandSize = 0;
    switch (operandSizePrefix) {
      case 0:
        operandSize = operandSizeTable[this.opCode];
        break;
      case 1:
        operandSize = script[ip];
        break;
      case 2:
        operandSize = script.readUInt16LE(ip);
        break;
      case 4:
        operandSize = script.readInt32LE(ip);
        break;
      default:
      // do nothing
    }

    if (operandSize > 0) {
      ip += operandSizePrefix;
      if (ip + operandSize > script.length) {
        throw new Error();
      }
      this.operand = script.slice(ip, ip + operandSize);
    } else {
      this.operand = Buffer.from([]);
    }
  }

  public get size() {
    const prefixSize = operandSizePrefixTable[this.opCode];

    if (prefixSize > 0) {
      return prefixSize + this.operand.length + 1;
    }

    return operandSizeTable[this.opCode] + 1;
  }

  public get tokenI16() {
    return this.operand.readInt16LE(0);
  }

  public get tokenI32() {
    return this.operand.readInt32LE(0);
  }

  public get tokenI32_1() {
    return this.operand.readInt16LE(4);
  }

  public get tokenI8() {
    return this.operand.readInt8(0);
  }

  public get tokenI8_1() {
    return this.operand.readInt8(1);
  }

  public get tokenString() {
    return this.operand.toString('ascii');
  }

  public get tokenU16() {
    return this.operand.readUInt16LE(0);
  }

  public get tokenU32() {
    return this.operand.readUInt32LE(0);
  }

  public get tokenU8() {
    return this.operand.readUInt8(0);
  }

  public get tokenU8_1() {
    return this.operand.readUInt8(1);
  }
}
