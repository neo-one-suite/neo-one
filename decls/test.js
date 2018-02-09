/* @flow */
type One = {|
  execute: (command: string) => Promise<string>,
|};
declare var one: One;
