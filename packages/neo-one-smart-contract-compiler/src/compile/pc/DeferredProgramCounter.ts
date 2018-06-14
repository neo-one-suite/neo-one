import { ProgramCounter } from './ProgramCounter';

export class DeferredProgramCounter extends ProgramCounter {
  private mutablePC: ProgramCounter | undefined;

  public constructor(private readonly offset: number = 0) {
    super();
  }

  public plus(offset: number): ProgramCounter {
    return new DeferredProgramCounter(this.offset + offset);
  }

  public equals(other: ProgramCounter): boolean {
    return this === other;
  }

  public setPC(pc: ProgramCounter): void {
    this.mutablePC = pc;
  }

  public getPC(): number {
    if (this.mutablePC === undefined) {
      throw new Error('Unknown PC');
    }

    return this.mutablePC.getPC() + this.offset;
  }
}
