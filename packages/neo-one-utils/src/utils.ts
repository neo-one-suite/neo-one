const nowSeconds = (): number => Math.round(Date.now() / 1000);

function nullthrows<T>(value: T | null): T {
  if (value == null) {
    throw new Error('Unexpected null');
  }

  return value;
}

function assertNever(value: never): void {
  // do nothing
}

export const utils = {
  nowSeconds,
  nullthrows,
  assertNever,
  notNull<T>(value: T | null | undefined): value is T {
    return value != null;
  },
};
