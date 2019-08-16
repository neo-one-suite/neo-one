export type Disposable = () => void | Promise<void>;

export const noopDisposable: Disposable = async () => {
  // do nothing
};

export const composeDisposables = (...disposables: readonly Disposable[]): Disposable => async () => {
  await Promise.all(disposables.map((dispose) => dispose()));
};
