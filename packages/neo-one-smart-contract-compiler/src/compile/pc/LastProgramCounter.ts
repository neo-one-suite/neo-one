import { ProgramCounter } from './ProgramCounter';

export class LastProgramCounter extends ProgramCounter {
  private mutablePC: number | undefined;
  private readonly mutableChildren: LastProgramCounter[] = [];

  public constructor(private readonly startPC: number, private readonly offset: number = 0) {
    super();
  }

  public plus(offset: number): ProgramCounter {
    const pc = new LastProgramCounter(this.startPC, this.offset + offset);
    this.mutableChildren.push(pc);
    if (this.mutablePC !== undefined) {
      pc.setPC(this.mutablePC);
    }

    return pc;
  }

  public equals(other: ProgramCounter): boolean {
    return other instanceof LastProgramCounter && this.startPC === other.startPC && this.offset === other.offset;
  }

  public setPC(pc: number): void {
    this.mutablePC = pc;
    this.mutableChildren.forEach((child) => {
      child.setPC(pc);
    });
  }

  public getPC(): number {
    if (this.mutablePC === undefined) {
      throw new Error('Unknown PC');
    }

    return this.mutablePC + this.offset;
  }
}
