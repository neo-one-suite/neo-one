import _ from 'lodash';

const nowSeconds = (): number => Math.round(Date.now() / 1000);

function nullthrows<T>(value: T | null | undefined): T {
  if (value == undefined) {
    throw new Error('Unexpected null');
  }

  return value;
}

function numCompAscending(a: number, b: number): -1 | 0 | 1 {
  if (a < b) {
    return -1;
  }
  if (b < a) {
    return 1;
  }

  return 0;
}

function numCompDescending(a: number, b: number) {
  return numCompAscending(a, b) * -1;
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
  numCompAscending,
  numCompDescending,
  assertNever,
  notNull,
  isPromise,
  zip,
};
