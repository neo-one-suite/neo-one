/* @flow */
import type { Log, LogMessage } from '@neo-one/utils';
import type { Observable } from 'rxjs/Observable';
import type { Subject } from 'rxjs/Subject';
import type Vorpal, { Args, Command } from 'vorpal';

import type Client from './Client';

export type Binary = {|
  cmd: string,
  firstArg: string,
|};

export type LogConfig = {|
  name: string,
  path: string,
  level: string,
  maxSize: number,
  maxFiles: number,
|};

export type CLIArgs = {|
  log: Log,
  shutdown: (options: {|
    exitCode: number,
    error?: ?Error,
  |}) => void,
  shutdownFuncs: Array<() => Promise<void> | void>,
  logConfig$: Subject<LogConfig>,
  vorpal: Vorpal,
  debug: boolean,
  binary: Binary,
|};

// flowlint-next-line unclear-type:off
export type Session = Object;

export type ListTable = Array<Array<string>>;
export type DescribeTable = Array<
  [
    string,


      | string
      | {| type: 'list', table: ListTable |}
      | {| type: 'describe', table: DescribeTable |},
  ],
>;

export type InteractiveCLI = {
  +vorpal: Vorpal,
  +client: Client,
  +debug: boolean,
  +updateSession: (plugin: string, session: Session) => void,
  +mergeSession: (plugin: string, session: Session) => void,
  +getSession: (plugin: string) => Promise<Session>,
  +getSession$: (plugin: string) => Observable<Session>,
  +addDelimiter: (key: string, name: string) => void,
  +removeDelimiter: (key: string) => void,
  +resetDelimiter: () => void,
  +log: (message: LogMessage) => void,
  +exec: (command: string) => Promise<void>,
  +printDescribe: (
    describeTable: DescribeTable,
    log?: (value: string) => void,
  ) => void,
  +printList: (listTable: ListTable, log?: (value: string) => void) => void,
};

export type InteractiveCLIArgs = {|
  cli: InteractiveCLI,
|};

export type InteractiveCommand = (cliArgs: InteractiveCLIArgs) => Command;

export type ResourceState = 'started' | 'stopped';
export type BaseResource = {
  plugin: string,
  resourceType: string,
  name: string,
  baseName: string,
  state: ResourceState,
};

export type CLIHook = (options: {|
  cli: InteractiveCLI,
  args: Args,
|}) => Promise<void>;
