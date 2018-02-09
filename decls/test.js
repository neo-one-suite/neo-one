/* @flow */
type One = {|
  execute: (command: string) => Promise<string>,
  parseJSON: (value: string) => any,
|};
declare var one: One;
