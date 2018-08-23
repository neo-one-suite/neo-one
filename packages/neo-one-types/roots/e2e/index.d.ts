declare interface One {
  readonly addCleanup: (callback: () => Promise<void> | void) => void;
  readonly cleanupTest: () => Promise<void>;
  readonly execute: (command: string, options?: object) => Promise<string>;
  // tslint:disable-next-line no-any
  readonly parseJSON: (value: string) => any;
  readonly until: (func: () => Promise<void>) => Promise<void>;
  readonly measureRequire: (mod: string) => Promise<number>;
}
declare const one: One;
