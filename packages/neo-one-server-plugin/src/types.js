/* @flow */
import type { Observable } from 'rxjs/Observable';
import type { Subject } from 'rxjs/Subject';
import type Vorpal, { Args, Command } from 'vorpal';
import type { Monitor } from '@neo-one/monitor';

import type { Paths } from './paths';
import type { ResourceAdapter } from './ResourceAdapter';
import type { ResourceDependency } from './MasterResourceAdapter';
import type ResourceType from './ResourceType';
import type TaskList, { Task } from './TaskList';

export type ListTable = Array<Array<string>>;
export type DescribeTable = Array<
  [
    string,


      | string
      | {| type: 'list', table: ListTable |}
      | {| type: 'describe', table: DescribeTable |},
  ],
>;

export type ResourceState = 'started' | 'stopped';
export type BaseResource = {
  plugin: string,
  resourceType: string,
  name: string,
  baseName: string,
  state: ResourceState,
};
export type BaseResourceOptions = Object;
export type GetResourceResponse = {| resources: Array<BaseResource> |};
export type DescribeResourceResponse = {| resource: BaseResource |};
export type TaskStatus = {
  id: string,
  title: string,
  message?: string,
  subtasks?: Array<TaskStatus>,
  pending?: boolean,
  skipped?: string | boolean,
  complete?: boolean,
  error?: string,
  collapse: boolean,
};
export type ModifyResourceResponse = {|
  tasks: Array<TaskStatus>,
|};
export type ReadRequest = { type: 'start' | 'abort' };
export type ReadResponse =
  | {|
      type: 'response',
      response: $FlowFixMe,
    |}
  | {|
      type: 'error',
      code: string,
      message: string,
    |}
  | {|
      type: 'aborted',
    |};

export type CRUDRequestStart = {|
  type: 'start',
  plugin: string,
  resourceType: string,
  name: string,
  options: string,
|};
export type CRUDRequestAbort = {| type: 'abort' |};
export type CRUDRequest = CRUDRequestStart | CRUDRequestAbort;
export type AllResources = {
  [pluginResourceType: string]: Array<BaseResource>,
};

export type Client = {
  getVersion(): Promise<string>,
  getDebug(): Promise<DescribeTable>,
  getAllPlugins(): Promise<Array<string>>,
  getPlugins$(): Observable<string>,
  getAllResources$(): Observable<AllResources>,
  getResources$(options: {|
    plugin: string,
    resourceType: string,
    options: BaseResourceOptions,
  |}): Observable<Array<BaseResource>>,
  getResource$(options: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: BaseResourceOptions,
  |}): Observable<?BaseResource>,
  getResource(options: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: BaseResourceOptions,
  |}): Promise<?BaseResource>,
  createResource$(options: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: BaseResourceOptions,
    cancel$: Observable<void>,
  |}): Observable<ModifyResourceResponse>,
  createResource(options: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: BaseResourceOptions,
    cancel$: Observable<void>,
  |}): Promise<BaseResource>,
  deleteResource$(options: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: BaseResourceOptions,
    cancel$: Observable<void>,
  |}): Observable<ModifyResourceResponse>,
  startResource$(options: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: BaseResourceOptions,
    cancel$: Observable<void>,
  |}): Observable<ModifyResourceResponse>,
  stopResource$(options: {|
    plugin: string,
    resourceType: string,
    name: string,
    options: BaseResourceOptions,
    cancel$: Observable<void>,
  |}): Observable<ModifyResourceResponse>,
};

export type Binary = {|
  cmd: string,
  firstArgs: Array<string>,
|};

export type LogConfig = {|
  name: string,
  path: string,
  level: string,
  maxSize: number,
  maxFiles: number,
|};

export type CLIArgs = {|
  monitor: Monitor,
  shutdown: (options: {|
    exitCode: number,
    error?: ?Error,
  |}) => void,
  shutdownFuncs: Array<() => Promise<void> | void>,
  logConfig$: Subject<LogConfig>,
  vorpal: Vorpal,
  debug: boolean,
  binary: Binary,
  serverArgs: {|
    dir?: string,
    serverPort?: number,
    minPort?: number,
  |},
  paths: Paths,
|};

export type Session = Object;

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
  +prompt: (questions: Array<Object>) => Promise<Object>,
  +monitor: Monitor,
  +exec: (command: string) => Promise<void>,
  +printDescribe: (
    describeTable: DescribeTable,
    log?: (value: string) => void,
  ) => void,
  +printList: (listTable: ListTable, log?: (value: string) => void) => void,
  +getResourceType: (options: {|
    plugin: string,
    resourceType: string,
  |}) => ResourceType<any, any>,
};

export type InteractiveCLIArgs = {|
  cli: InteractiveCLI,
|};

export type InteractiveCommand = (cliArgs: InteractiveCLIArgs) => Command;

export type CLIHook = (options: {|
  cli: InteractiveCLI,
  args: Args,
|}) => Promise<void>;

export type PortAllocator = {
  allocatePort(options: {|
    plugin: string,
    resourceType: string,
    resource: string,
    name: string,
  |}): number,
  releasePort(options: {|
    plugin: string,
    resourceType: string,
    resource: string,
    name?: string,
  |}): void,
};

export type ResourcesManager<
  Resource: BaseResource,
  ResourceOptions: BaseResourceOptions,
> = {
  getResources$(options: ResourceOptions): Observable<Array<Resource>>,
  getResource$(options: {|
    name: string,
    options: ResourceOptions,
  |}): Observable<?Resource>,
  getResourceAdapter(name: string): ResourceAdapter<Resource, ResourceOptions>,
  masterResourceAdapter: any,
  addDependent(name: string, dependent: ResourceDependency): void,
  create(name: string, options: ResourceOptions): TaskList,
};

export type PluginManager = {
  getResourcesManager(options: {|
    plugin: string,
    resourceType: string,
  |}): ResourcesManager<*, *>,
};

export type CreateHook = (options: {|
  name: string,
  options: BaseResourceOptions,
  pluginManager: PluginManager,
|}) => Task;
