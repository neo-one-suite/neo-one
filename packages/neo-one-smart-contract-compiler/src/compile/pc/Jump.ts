import { ProgramCounter } from './ProgramCounter';

export type JumpOp = 'CALL' | 'JMP' | 'JMPIF' | 'JMPIFNOT';

export abstract class Jump<TOp extends JumpOp = JumpOp> {
  public constructor(public readonly op: TOp, public readonly pc: ProgramCounter) {}

  public abstract plus(pc: number): Jump<TOp>;
}
