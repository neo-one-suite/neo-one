export abstract class ProgramCounter {
  public abstract plus(value: number): ProgramCounter;
  public abstract equals(other: ProgramCounter): boolean;
  public abstract getPC(): number;
}
