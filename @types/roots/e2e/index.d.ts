declare interface One {
  execute: (command: string) => Promise<string>;
  parseJSON: (value: string) => any;
  until: (func: () => Promise<void>) => Promise<void>;
}
declare const one: One;
