import { KnownProgramCounter } from './KnownProgramCounter';
import { LastProgramCounter } from './LastProgramCounter';
import { ProgramCounter } from './ProgramCounter';

export class ProgramCounterHelper {
  private readonly pc: () => number;
  private readonly first: KnownProgramCounter;
  private readonly last: LastProgramCounter;

  public constructor(pc: () => number) {
    this.pc = pc;
    this.first = new KnownProgramCounter(this.pc());
    this.last = new LastProgramCounter(this.pc());
  }

  public getFirst(): ProgramCounter {
    return this.first;
  }

  public getCurrent(): ProgramCounter {
    return new KnownProgramCounter(this.pc());
  }

  public getLast(): ProgramCounter {
    return this.last;
  }

  public setLast(): void {
    this.last.setPC(this.pc());
  }
}
