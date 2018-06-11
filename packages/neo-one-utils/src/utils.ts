const nowSeconds = (): number => Math.round(Date.now() / 1000);

function nullthrows<T>(value: T | null): T {
  if (value == null) {
    throw new Error('Unexpected null');
  }

  return value;
}

export const utils = {
  nowSeconds,
  nullthrows,
};
