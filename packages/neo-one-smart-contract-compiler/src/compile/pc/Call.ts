import { Jump } from './Jump';
import { ProgramCounter } from './ProgramCounter';

export class Call extends Jump {
  public constructor(pc: ProgramCounter) {
    super('CALL_L', pc);
  }

  public plus(pc: number): Call {
    return new Call(this.pc.plus(pc));
  }
}
