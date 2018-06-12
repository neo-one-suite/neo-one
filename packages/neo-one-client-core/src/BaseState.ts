export class BaseState {
  public static readonly VERSION = 0;
  public readonly version: number;

  constructor({ version: versionIn }: { version?: number }) {
    this.version =
      versionIn == null
        ? (this.constructor as typeof BaseState).VERSION
        : versionIn;
  }
}
