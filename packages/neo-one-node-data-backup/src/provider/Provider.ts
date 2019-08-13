export class Provider {
  public async canRestore(): Promise<boolean> {
    throw new Error('Not Implemented');
  }

  public async restore(): Promise<void> {
    throw new Error('Not Implemented');
  }

  public async backup(): Promise<void> {
    throw new Error('Not Implemented');
  }
}
