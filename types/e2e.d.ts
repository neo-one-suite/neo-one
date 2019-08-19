declare interface One {
  readonly addCleanup: (callback: () => Promise<void> | void) => void;
  readonly cleanupTest: () => Promise<void>;
  readonly createExec: (project: string) => (command: string, options?: object) => Promise<string>;
  readonly createExecAsync: (project: string) => (command: string, options?: object) => void;
  readonly until: (func: () => Promise<void>) => Promise<void>;
  readonly measureRequire: (mod: string) => Promise<number>;
  readonly getProjectConfig: (project: string) => any;
}
declare const one: One;
