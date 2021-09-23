export type Disposable = () => void | Promise<void>;

export const noopDisposable: Disposable = async () => {
  // do nothing
};

export const composeDisposables =
  (...disposables: readonly Disposable[]): Disposable =>
  async () => {
    await Promise.all(disposables.map((dispose) => dispose()));
  };

export const composeInOrderDisposables =
  (...disposables: readonly Disposable[]): Disposable =>
  async () => {
    // tslint:disable-next-line: no-loop-statement
    for (const disposable of disposables) {
      await disposable();
    }
  };

export const composeDisposable = (newDisposable: Disposable, prevDisposable: Disposable) => async () => {
  await newDisposable();
  await prevDisposable();
};
