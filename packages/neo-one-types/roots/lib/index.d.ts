// tslint:disable
declare interface ReadonlyArray<T> {
  sort(compareFn?: (a: T, b: T) => number): this;
  reverse(): this;
}

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

type Modifiable<T> = { -readonly [P in keyof T]: T[P] };
type PromiseReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer R> ? R : any;

declare module '*.woff' {
  export default '';
}

declare module '*.woff2' {
  export default '';
}

declare module '*.svg' {
  export default '';
}
