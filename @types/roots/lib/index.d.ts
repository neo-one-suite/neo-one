// tslint:disable
declare interface ReadonlyArray<T> {
  sort(compareFn?: (a: T, b: T) => number): this;
  reverse(): this;
}
