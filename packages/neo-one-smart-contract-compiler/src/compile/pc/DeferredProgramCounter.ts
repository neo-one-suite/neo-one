import { ProgramCounter } from './ProgramCounter';

export class DeferredProgramCounter extends ProgramCounter {
  private pc: ProgramCounter | undefined;

  constructor(private readonly offset?: number) {
    super();
  }

  public plus(offset: number): ProgramCounter {
    return new DeferredProgramCounter((this.offset || 0) + offset);
  }

  public equals(other: ProgramCounter): boolean {
    return this === other;
  }

  public setPC(pc: ProgramCounter): void {
    this.pc = pc;
  }

  public getPC(): number {
    if (this.pc == null) {
      throw new Error('Unknown PC');
    }

    return this.pc.getPC() + (this.offset || 0);
  }
}
