const nowSeconds = (): number => Math.round(Date.now() / 1000);

function nullthrows<T>(value: T | null | undefined): T {
  if (value == undefined) {
    throw new Error('Unexpected null');
  }

  return value;
}

function assertNever(_value: never): void {
  // do nothing
}

function isPromise(value: {}): value is Promise<{}> {
  // tslint:disable-next-line no-any
  return (value as any).then != undefined && typeof (value as any).then === 'function';
}

function notNull<T>(value: T | null | undefined): value is T {
  return value != undefined;
}

export const utils = {
  nowSeconds,
  nullthrows,
  assertNever,
  notNull,
  isPromise,
};
