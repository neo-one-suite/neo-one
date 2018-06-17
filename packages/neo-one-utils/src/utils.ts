import _ from 'lodash';

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

// tslint:disable-next-line no-any
function isPromise(value: any): value is Promise<{}> {
  return value != undefined && value.then != undefined && typeof value.then === 'function';
}

function notNull<T>(value: T | null | undefined): value is T {
  return value != undefined;
}

// tslint:disable readonly-array
function zip<T1, T2>(a: ArrayLike<T1>, b: ArrayLike<T2>): Array<[T1, T2]>;
function zip<T1, T2, T3>(a: ArrayLike<T1>, b: ArrayLike<T2>, c: ArrayLike<T3>): Array<[T1, T2, T3]>;
function zip<T>(...arrays: Array<ArrayLike<T> | null | undefined>): T[][] {
  // tslint:disable-next-line no-any
  return _.zip(...arrays) as any;
}
// tslint:enable readonly-array

export const utils = {
  nowSeconds,
  nullthrows,
  assertNever,
  notNull,
  isPromise,
  zip,
};
