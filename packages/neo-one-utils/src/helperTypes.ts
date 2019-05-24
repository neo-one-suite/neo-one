// tslint:disable
export type OmitStrict<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Modifiable<T> = { -readonly [P in keyof T]: T[P] };
export type PromiseReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer R>
  ? R
  : any;
export type Constructor<T> = new (...args: any[]) => T;
