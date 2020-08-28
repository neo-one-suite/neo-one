export class BaseState {
  public static readonly VERSION = 0;
  public readonly version: number;

  public constructor({ version: versionIn }: { readonly version?: number }) {
    this.version = versionIn === undefined ? (this.constructor as typeof BaseState).VERSION : versionIn;
  }
}
