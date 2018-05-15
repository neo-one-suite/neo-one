import { Jump } from './Jump';
import { ProgramCounter } from './ProgramCounter';

export class Call extends Jump {
  constructor(pc: ProgramCounter) {
    super('CALL', pc);
  }

  public plus(pc: number): Call {
    return new Call(this.pc.plus(pc));
  }
}
