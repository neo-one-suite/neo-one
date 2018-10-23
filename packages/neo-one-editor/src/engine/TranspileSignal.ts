export class TranspileSignal {
  private mutableTranspiling = 0;
  private mutablePromise: Promise<void> | undefined;
  private mutableResolve: (() => void) | undefined;

  public async wait(): Promise<void> {
    if (this.mutableTranspiling > 0) {
      if (this.mutablePromise === undefined) {
        // tslint:disable-next-line:promise-must-complete
        this.mutablePromise = new Promise<void>((resolve) => {
          this.mutableResolve = resolve;
        });
      }

      return this.mutablePromise;
    }

    return Promise.resolve();
  }

  public transpiling(): void {
    this.mutableTranspiling += 1;
  }

  public done(): void {
    this.mutableTranspiling -= 1;

    if (this.mutableTranspiling === 0) {
      if (this.mutableResolve !== undefined) {
        this.mutableResolve();
      }

      this.mutablePromise = undefined;
    }
  }
}
