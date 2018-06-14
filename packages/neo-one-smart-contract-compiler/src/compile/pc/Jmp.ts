import { Jump } from './Jump';
import { ProgramCounter } from './ProgramCounter';

export type JmpOp = 'JMP' | 'JMPIF' | 'JMPIFNOT';

export class Jmp extends Jump<JmpOp> {
  public constructor(op: JmpOp, pc: ProgramCounter) {
    super(op, pc);
  }

  public plus(pc: number): Jmp {
    return new Jmp(this.op, this.pc.plus(pc));
  }
}
