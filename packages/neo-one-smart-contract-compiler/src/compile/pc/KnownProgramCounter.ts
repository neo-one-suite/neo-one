import { ProgramCounter } from './ProgramCounter';

export class KnownProgramCounter extends ProgramCounter {
  constructor(private readonly pc: number) {
    super();
  }

  public plus(offset: number): ProgramCounter {
    return new KnownProgramCounter(this.pc + offset);
  }

  public equals(other: ProgramCounter): boolean {
    return other instanceof KnownProgramCounter && this.pc === other.pc;
  }

  public getPC(): number {
    return this.pc;
  }
}
