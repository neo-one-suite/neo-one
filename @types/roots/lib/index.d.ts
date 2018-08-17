// tslint:disable
declare interface ReadonlyArray<T> {
  sort(compareFn?: (a: T, b: T) => number): this;
  reverse(): this;
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type Modifiable<T> = { -readonly [P in keyof T]: T[P] };
