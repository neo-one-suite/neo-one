export class CustomError extends Error {
  public readonly message: string;

  public constructor(message?: string) {
    super(message);
    this.message = message === undefined ? '' : message;

    // tslint:disable-next-line no-any
    (this as any).__proto__ = CustomError.prototype;
  }
}
