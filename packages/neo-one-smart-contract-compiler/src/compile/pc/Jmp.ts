import { Jump } from './Jump';
import { ProgramCounter } from './ProgramCounter';

export type JmpOp =
  | 'JMP_L'
  | 'JMPIF_L'
  | 'JMPIFNOT_L'
  | 'JMPEQ_L'
  | 'JMPNE_L'
  | 'JMPGT_L'
  | 'JMPGE_L'
  | 'JMPLT_L'
  | 'JMPLE_L';

export class Jmp extends Jump<JmpOp> {
  public constructor(op: JmpOp, pc: ProgramCounter) {
    super(op, pc);
  }

  public plus(pc: number): Jmp {
    return new Jmp(this.op, this.pc.plus(pc));
  }
}
