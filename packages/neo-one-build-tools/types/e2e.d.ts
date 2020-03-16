declare interface NodeProject {
  readonly exec: (command: string, options?: object) => void;
  readonly env: any;
}

declare interface One {
  readonly addCleanup: (callback: () => Promise<void> | void) => void;
  readonly cleanupTest: () => Promise<void>;
  readonly createExec: (project: string) => (command: string, options?: object) => Promise<string>;
  readonly createExecAsync: (project: string) => (command: string, options?: object) => void;
  readonly createNodeProject: (project: string) => NodeProject;
  readonly until: (func: () => Promise<void>, timeoutMS?: number) => Promise<void>;
  readonly measureRequire: (mod: string) => Promise<number>;
  readonly getProjectConfig: (project: string) => any;
}
declare const one: One;
