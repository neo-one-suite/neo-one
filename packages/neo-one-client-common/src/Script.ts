import { InvalidScriptError } from './errors';
import { Instruction } from './Instruction';
import { assertByteCode, Byte, Op } from './models';
import { isStackItemType, StackItemType } from './StackItemType';

export class Script {
  private readonly script: Buffer;
  private readonly strictMode: boolean;
  private readonly instructions: Map<number, Instruction>;

  public constructor(script: Buffer, strictMode: boolean | undefined = false) {
    this.script = script;
    this.instructions = new Map<number, Instruction>();

    if (strictMode) {
      // tslint:disable-next-line: no-empty no-loop-statement
      for (let ip = 0; ip < this.script.length; ip += this.getInstruction(ip).size) {}
      // tslint:disable-next-line: no-loop-statement
      for (const [ip, instruction] of this.instructions) {
        // tslint:disable-next-line: switch-default
        switch (instruction.opCode) {
          case Op.JMP:
          case Op.JMPIF:
          case Op.JMPIFNOT:
          case Op.JMPEQ:
          case Op.JMPNE:
          case Op.JMPGT:
          case Op.JMPGE:
          case Op.JMPLT:
          case Op.JMPLE:
          case Op.CALL:
          case Op.ENDTRY:
            if (!this.instructions.has(ip + instruction.tokenI8)) {
              throw new InvalidScriptError(Byte[instruction.opCode], ip);
            }
            break;
          case Op.PUSHA:
          case Op.JMP_L:
          case Op.JMPIF_L:
          case Op.JMPIFNOT_L:
          case Op.JMPEQ_L:
          case Op.JMPNE_L:
          case Op.JMPGT_L:
          case Op.JMPGE_L:
          case Op.JMPLT_L:
          case Op.JMPLE_L:
          case Op.CALL_L:
          case Op.ENDTRY_L:
            if (!this.instructions.has(ip + instruction.tokenI32)) {
              throw new InvalidScriptError(Byte[instruction.opCode], ip);
            }
            break;
          case Op.TRY:
            if (!this.instructions.has(ip + instruction.tokenI8)) {
              throw new InvalidScriptError(Byte[instruction.opCode], ip);
            }
            if (!this.instructions.has(ip + instruction.tokenI8_1)) {
              throw new InvalidScriptError(Byte[instruction.opCode], ip);
            }
            break;
          case Op.TRY_L:
            if (!this.instructions.has(ip + instruction.tokenI32)) {
              throw new InvalidScriptError(Byte[instruction.opCode], ip);
            }
            if (!this.instructions.has(ip + instruction.tokenI32_1)) {
              throw new InvalidScriptError(Byte[instruction.opCode], ip);
            }
            break;
          case Op.NEWARRAY_T:
          case Op.ISTYPE:
          case Op.CONVERT:
            const type = instruction.tokenU8;
            if (!isStackItemType(type)) {
              throw new InvalidScriptError(Byte[instruction.opCode], ip);
            }
            if (instruction.opCode !== Op.NEWARRAY_T && type === StackItemType.Any) {
              throw new InvalidScriptError(Byte[instruction.opCode], ip);
            }
        }
      }
    }

    this.strictMode = strictMode;
  }

  public get buffer(): Buffer {
    return this.script;
  }

  public get length(): number {
    return this.script.length;
  }

  public getOpCode(index: number): Op {
    return assertByteCode(this.script[index]);
  }

  public getInstruction(ip: number): Instruction {
    if (ip >= this.length) {
      return Instruction.RET;
    }

    let instructionOut = this.instructions.get(ip);
    if (instructionOut === undefined) {
      if (this.strictMode) {
        throw new Error('ip not found with strict mode');
      }
      instructionOut = new Instruction(this.script, ip);
      this.instructions.set(ip, instructionOut);
    }

    return instructionOut;
  }
}
