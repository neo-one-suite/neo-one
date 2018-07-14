declare interface One {
  readonly execute: (command: string) => Promise<string>;
  // tslint:disable-next-line no-any
  readonly parseJSON: (value: string) => any;
  readonly until: (func: () => Promise<void>) => Promise<void>;
  readonly measureImport: (mod: string) => Promise<number>;
  readonly measureRequire: (mod: string) => Promise<number>;
}
declare const one: One;
