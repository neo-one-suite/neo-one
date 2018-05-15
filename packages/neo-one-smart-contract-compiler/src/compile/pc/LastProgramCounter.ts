import { ProgramCounter } from './ProgramCounter';

export class LastProgramCounter extends ProgramCounter {
  private pc: number | undefined;
  private readonly children: LastProgramCounter[] = [];

  constructor(
    private readonly startPC: number,
    private readonly offset?: number,
  ) {
    super();
  }

  public plus(offset: number): ProgramCounter {
    const pc = new LastProgramCounter(
      this.startPC,
      (this.offset || 0) + offset,
    );
    this.children.push(pc);
    if (this.pc != null) {
      pc.setPC(this.pc);
    }
    return pc;
  }

  public equals(other: ProgramCounter): boolean {
    return (
      other instanceof LastProgramCounter &&
      this.startPC === other.startPC &&
      this.offset === other.offset
    );
  }

  public setPC(pc: number): void {
    this.pc = pc;
    this.children.forEach((child) => {
      child.setPC(pc);
    });
  }

  public getPC(): number {
    if (this.pc == null) {
      throw new Error('Unknown PC');
    }

    return this.pc + (this.offset || 0);
  }
}
